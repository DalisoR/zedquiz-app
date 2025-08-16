// PesaPal Payment Service for ZedQuiz
// Handles subscription payments via PesaPal API

class PesaPalService {
  constructor() {
    // PesaPal API Configuration
    this.baseURL = process.env.REACT_APP_PESAPAL_SANDBOX === 'true' 
      ? 'https://cybqa.pesapal.com/pesapalv3' 
      : 'https://pay.pesapal.com/v3';
    
    this.consumerKey = process.env.REACT_APP_PESAPAL_CONSUMER_KEY;
    this.consumerSecret = process.env.REACT_APP_PESAPAL_CONSUMER_SECRET;
    this.callbackURL = process.env.REACT_APP_PESAPAL_CALLBACK_URL || `${window.location.origin}/payment-callback`;
    this.ipnURL = process.env.REACT_APP_PESAPAL_IPN_URL || `${window.location.origin}/api/pesapal-ipn`;
  }

  // Generate authentication token
  async getAuthToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret
        })
      });

      const data = await response.json();
      
      if (data.status === '200' && data.token) {
        // Store token with expiry
        const tokenData = {
          token: data.token,
          expiresAt: Date.now() + (data.expiryDate ? new Date(data.expiryDate).getTime() - Date.now() : 3600000) // 1 hour default
        };
        localStorage.setItem('pesapal_token', JSON.stringify(tokenData));
        return data.token;
      }
      
      throw new Error(data.message || 'Failed to get auth token');
    } catch (error) {
      console.error('PesaPal Auth Error:', error);
      throw new Error('Failed to authenticate with PesaPal');
    }
  }

  // Get valid token (from cache or request new)
  async getValidToken() {
    const stored = localStorage.getItem('pesapal_token');
    
    if (stored) {
      const tokenData = JSON.parse(stored);
      if (Date.now() < tokenData.expiresAt) {
        return tokenData.token;
      }
    }
    
    return await this.getAuthToken();
  }

  // Register IPN URL
  async registerIPN() {
    try {
      const token = await this.getValidToken();
      
      const response = await fetch(`${this.baseURL}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: this.ipnURL,
          ipn_notification_type: 'GET'
        })
      });

      const data = await response.json();
      
      if (data.status === '200') {
        localStorage.setItem('pesapal_ipn_id', data.ipn_id);
        return data.ipn_id;
      }
      
      throw new Error(data.message || 'Failed to register IPN');
    } catch (error) {
      console.error('PesaPal IPN Registration Error:', error);
      throw error;
    }
  }

  // Create subscription payment order
  async createSubscriptionOrder(subscriptionData) {
    try {
      const token = await this.getValidToken();
      
      // Ensure IPN is registered
      let ipnId = localStorage.getItem('pesapal_ipn_id');
      if (!ipnId) {
        ipnId = await this.registerIPN();
      }

      const orderData = {
        id: subscriptionData.orderId,
        currency: 'ZMW', // Zambian Kwacha
        amount: subscriptionData.amount,
        description: `ZedQuiz ${subscriptionData.planName} Subscription`,
        callback_url: this.callbackURL,
        notification_id: ipnId,
        billing_address: {
          email_address: subscriptionData.email,
          phone_number: subscriptionData.phone || '',
          country_code: 'ZM',
          first_name: subscriptionData.firstName || '',
          last_name: subscriptionData.lastName || '',
          line_1: subscriptionData.address || 'Lusaka, Zambia',
          city: subscriptionData.city || 'Lusaka',
          state: subscriptionData.state || 'Lusaka',
          postal_code: subscriptionData.postalCode || '10101',
          zip_code: subscriptionData.postalCode || '10101'
        }
      };

      const response = await fetch(`${this.baseURL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.status === '200' && data.redirect_url) {
        return {
          success: true,
          redirectUrl: data.redirect_url,
          orderTrackingId: data.order_tracking_id,
          merchantReference: data.merchant_reference
        };
      }
      
      throw new Error(data.message || 'Failed to create payment order');
    } catch (error) {
      console.error('PesaPal Order Creation Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment order'
      };
    }
  }

  // Check transaction status
  async checkTransactionStatus(orderTrackingId) {
    try {
      const token = await this.getValidToken();
      
      const response = await fetch(
        `${this.baseURL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.status === '200') {
        return {
          success: true,
          paymentStatus: data.payment_status_description,
          statusCode: data.status_code,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.payment_method,
          paymentAccount: data.payment_account,
          confirmationCode: data.confirmation_code
        };
      }
      
      throw new Error(data.message || 'Failed to check transaction status');
    } catch (error) {
      console.error('PesaPal Status Check Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check payment status'
      };
    }
  }

  // Generate unique order ID
  generateOrderId(userId, planId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ZEDQUIZ-${userId.substring(0, 8)}-${planId}-${timestamp}-${random}`.toUpperCase();
  }

  // Format amount for PesaPal (ensure 2 decimal places)
  formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
  }

  // Get supported payment methods
  getSupportedPaymentMethods() {
    return [
      {
        id: 'mobile_money',
        name: 'Mobile Money',
        description: 'MTN Mobile Money, Airtel Money',
        icon: '📱'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer',
        icon: '🏦'
      },
      {
        id: 'card',
        name: 'Card Payment',
        description: 'Visa, Mastercard',
        icon: '💳'
      }
    ];
  }

  // Validate environment configuration
  validateConfig() {
    const errors = [];
    
    if (!this.consumerKey) {
      errors.push('REACT_APP_PESAPAL_CONSUMER_KEY is required');
    }
    
    if (!this.consumerSecret) {
      errors.push('REACT_APP_PESAPAL_CONSUMER_SECRET is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const pesapalService = new PesaPalService();
export default pesapalService;