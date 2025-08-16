# PesaPal Integration Setup Guide

This guide will help you set up PesaPal payment processing for ZedQuiz subscriptions.

## 🚀 Quick Start

### 1. PesaPal Account Setup

1. **Create PesaPal Account**
   - Visit [PesaPal Developer Portal](https://developer.pesapal.com)
   - Sign up for a developer account
   - Complete KYC verification process

2. **Get API Credentials**
   - Login to PesaPal dashboard
   - Navigate to "API Keys" section
   - Generate Consumer Key and Consumer Secret
   - Note down your credentials

### 2. Environment Configuration

1. **Copy Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Configure PesaPal Settings**
   ```env
   # PesaPal Configuration
   REACT_APP_PESAPAL_CONSUMER_KEY=your_consumer_key_here
   REACT_APP_PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
   REACT_APP_PESAPAL_SANDBOX=true  # Set to false for production
   REACT_APP_PESAPAL_CALLBACK_URL=http://localhost:3000/payment-callback
   REACT_APP_PESAPAL_IPN_URL=http://localhost:3000/api/pesapal-ipn
   ```

### 3. Database Setup

Run the payments migration:

```sql
-- Execute in Supabase SQL Editor
\i supabase/migrations/005_payments_subscriptions.sql
```

### 4. Test Payment Flow

1. **Start Development Server**
   ```bash
   npm start
   ```

2. **Test Subscription Flow**
   - Register/Login as a student
   - Navigate to "Subscriptions" page
   - Select a plan (Premium or Pro)
   - Fill in payment details
   - Complete payment on PesaPal sandbox

## 🔧 Configuration Options

### Sandbox vs Production

**Sandbox (Testing)**
```env
REACT_APP_PESAPAL_SANDBOX=true
```
- Base URL: `https://cybqa.pesapal.com/pesapalv3`
- Use test credentials
- No real money transactions

**Production**
```env
REACT_APP_PESAPAL_SANDBOX=false
```
- Base URL: `https://pay.pesapal.com/v3`
- Use live credentials
- Real money transactions

### Callback URLs

**Development**
```env
REACT_APP_PESAPAL_CALLBACK_URL=http://localhost:3000/payment-callback
REACT_APP_PESAPAL_IPN_URL=http://localhost:3000/api/pesapal-ipn
```

**Production**
```env
REACT_APP_PESAPAL_CALLBACK_URL=https://yourdomain.com/payment-callback
REACT_APP_PESAPAL_IPN_URL=https://yourdomain.com/api/pesapal-ipn
```

## 💳 Supported Payment Methods

PesaPal supports various payment methods in Zambia:

### Mobile Money
- **MTN Mobile Money**
- **Airtel Money**

### Bank Transfers
- **Direct Bank Transfer**
- **Real-time bank payments**

### Card Payments
- **Visa**
- **Mastercard**
- **Local bank cards**

## 🔐 Security Features

### Payment Security
- **PCI DSS Compliant** - All card data is securely handled
- **SSL Encryption** - All communications are encrypted
- **Tokenization** - Sensitive data is tokenized
- **3D Secure** - Additional authentication for cards

### Data Protection
- **No Storage** - We never store payment details
- **Audit Trail** - All transactions are logged
- **Fraud Detection** - Built-in fraud prevention
- **Compliance** - Meets Zambian financial regulations

## 📊 Payment Flow

### 1. Subscription Selection
```
Student selects plan → Billing details → Payment processing
```

### 2. PesaPal Integration
```
Create order ��� Redirect to PesaPal → Payment completion → Callback handling
```

### 3. Subscription Activation
```
Payment verification → Database update → Subscription activation → Email confirmation
```

## 🛠 Development

### Local Testing

1. **Use Sandbox Mode**
   ```env
   REACT_APP_PESAPAL_SANDBOX=true
   ```

2. **Test Credentials**
   - Use PesaPal sandbox credentials
   - Test with dummy payment methods
   - Verify callback handling

3. **Debug Tools**
   - Check browser console for errors
   - Monitor network requests
   - Review Supabase logs

### Production Deployment

1. **Environment Setup**
   ```env
   REACT_APP_PESAPAL_SANDBOX=false
   REACT_APP_PESAPAL_CONSUMER_KEY=live_key
   REACT_APP_PESAPAL_CONSUMER_SECRET=live_secret
   ```

2. **SSL Certificate**
   - Ensure HTTPS is enabled
   - Valid SSL certificate required
   - Update callback URLs to HTTPS

3. **Webhook Endpoint**
   - Deploy IPN handler to serverless function
   - Configure proper error handling
   - Set up monitoring and alerts

## 🔍 Troubleshooting

### Common Issues

**Authentication Errors**
```
Error: Failed to get auth token
```
- Check consumer key and secret
- Verify sandbox/production mode
- Ensure credentials are active

**Callback Issues**
```
Error: Payment callback failed
```
- Verify callback URL is accessible
- Check for CORS issues
- Ensure proper error handling

**Payment Failures**
```
Error: Payment processing failed
```
- Check payment method availability
- Verify amount and currency
- Review PesaPal transaction logs

### Debug Steps

1. **Check Environment Variables**
   ```bash
   echo $REACT_APP_PESAPAL_CONSUMER_KEY
   ```

2. **Test API Connection**
   - Use browser dev tools
   - Check network requests
   - Verify API responses

3. **Review Logs**
   - Browser console logs
   - Supabase function logs
   - PesaPal dashboard logs

## 📞 Support

### PesaPal Support
- **Email**: support@pesapal.com
- **Phone**: +254 20 2606 361
- **Documentation**: https://developer.pesapal.com

### ZedQuiz Support
- **Email**: support@zedquiz.com
- **Phone**: +260 977 123 456

## 🚀 Go Live Checklist

- [ ] PesaPal account verified and approved
- [ ] Live API credentials obtained
- [ ] SSL certificate installed
- [ ] Production environment variables set
- [ ] Callback URLs updated to HTTPS
- [ ] IPN handler deployed
- [ ] Payment flow tested end-to-end
- [ ] Error handling implemented
- [ ] Monitoring and alerts configured
- [ ] Customer support process established

## 💰 Pricing

### PesaPal Fees
- **Mobile Money**: 3.5% + K2.00
- **Card Payments**: 3.8% + K2.00
- **Bank Transfer**: 2.5% + K5.00

### ZedQuiz Subscription Plans
- **Premium**: K9.99/month or K99.99/year
- **Pro**: K19.99/month or K199.99/year

*All prices in Zambian Kwacha (ZMW)*