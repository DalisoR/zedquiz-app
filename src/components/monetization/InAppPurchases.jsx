import React, { useState, useEffect } from 'react';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import { FiCheck, FiShoppingCart, FiCreditCard, FiShield, FiArrowRight } from 'react-icons/fi';

const productCategories = [
  { id: 'all', name: 'All Products' },
  { id: 'premium', name: 'Premium Content' },
  { id: 'features', name: 'Features' },
  { id: 'resources', name: 'Study Resources' },
];

const InAppPurchases = ({ currentUser, setPage }) => {
  const { products = [], isLoading } = useMonetization();
  const { user } = useAuth?.() || {}; // Handle case where auth might not be available
  const history = useHistory();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPurchasing, setIsPurchasing] = useState({});
  const [error, setError] = useState('');
  
  // Use currentUser from props if available
  const activeUser = user || currentUser;

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handlePurchase = async (product) => {
    if (!activeUser) {
      // Redirect to login if no user is available
      setPage?.('login');
      history.push('/login', { state: { from: '/shop' } });
      return;
    }

    setIsPurchasing(prev => ({ ...prev, [product.id]: true }));
    setError('');
    
    try {
      // In a real implementation, this would integrate with a payment processor
      console.log('Attempting to purchase product:', product.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Successfully purchased ${product.name}!`);
      
      // In a real app, you would update the user's purchases here
      // and the UI would update via the context
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(prev => ({ ...prev, [product.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">No products available at the moment</h2>
        <p className="text-gray-500 mt-2">Please check back later for new products</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Premium Shop</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock premium content and features to enhance your learning experience
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {productCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    ${product.price}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-6">{product.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {product.features?.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <FiCheck className="text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePurchase(product.id)}
                  disabled={isPurchasing[product.id]}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPurchasing[product.id] ? (
                    'Processing...'
                  ) : (
                    <>
                      <FiShoppingCart />
                      Purchase Now
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <FiShield className="mr-2" />
                  Secure payment processing
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-gray-500">Check back later for new items!</p>
        </div>
      )}
      
      {/* Payment Methods */}
      <div className="mt-16 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Accepted Payment Methods</h2>
        <div className="flex flex-wrap items-center gap-6">
          {['Visa', 'Mastercard', 'American Express', 'Discover', 'PayPal'].map((method) => (
            <div key={method} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FiCreditCard className="text-gray-600 mr-2" />
              <span className="font-medium text-gray-700">{method}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-500">
          All transactions are secure and encrypted. We never store your payment details on our servers.
        </p>
      </div>
    </div>
  );
};

export default InAppPurchases;
