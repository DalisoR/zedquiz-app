import React, { useState } from 'react';

const productCategories = [
  { id: 'all', name: 'All Products' },
  { id: 'premium', name: 'Premium Content' },
  { id: 'features', name: 'Features' },
  { id: 'resources', name: 'Study Resources' }
];

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: 'Premium Quiz Pack',
    description: 'Access to 500+ premium quiz questions across all subjects',
    price: 29.99,
    category: 'premium',
    features: [
      'Detailed explanations for each answer',
      'Performance analytics',
      'Offline access',
      'Priority support'
    ]
  },
  {
    id: 2,
    name: 'Study Guide Bundle',
    description: 'Comprehensive study guides for all grade levels',
    price: 19.99,
    category: 'resources',
    features: ['PDF downloads', 'Interactive content', 'Regular updates', 'Mobile optimized']
  },
  {
    id: 3,
    name: 'Advanced Analytics',
    description: 'Detailed performance tracking and insights',
    price: 9.99,
    category: 'features',
    features: [
      'Progress tracking',
      'Weakness identification',
      'Study recommendations',
      'Performance reports'
    ]
  }
];

const InAppPurchases = ({ currentUser, setPage }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPurchasing, setIsPurchasing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredProducts =
    selectedCategory === 'all'
      ? mockProducts
      : mockProducts.filter(p => p.category === selectedCategory);

  const handlePurchase = async product => {
    if (!currentUser) {
      setPage('login');
      return;
    }

    setIsPurchasing(prev => ({ ...prev, [product.id]: true }));
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Successfully purchased ${product.name}!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(prev => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Premium Shop</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '1rem',
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              color: '#065f46',
              marginBottom: '1rem'
            }}
          >
            {success}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛍️</div>
          <h3 style={{ margin: '0 0 1rem 0' }}>Premium Shop</h3>
          <p style={{ fontSize: '1.125rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Unlock premium content and features to enhance your learning experience
          </p>
        </div>

        {/* Category Filter */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2rem'
          }}
        >
          {productCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === category.id ? '#3b82f6' : '#f3f4f6',
                color: selectedCategory === category.id ? 'white' : '#374151'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}
          >
            {filteredProducts.map(product => (
              <div key={product.id} className='card' style={{ padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{product.name}</h4>
                  <span
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    K{product.price}
                  </span>
                </div>

                <p style={{ color: '#666', marginBottom: '1.5rem' }}>{product.description}</p>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
                  {product.features?.map((feature, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}
                    >
                      <span
                        style={{ color: '#10b981', marginRight: '0.5rem', fontSize: '1.25rem' }}
                      >
                        ✓
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(product)}
                  disabled={isPurchasing[product.id]}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isPurchasing[product.id] ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: isPurchasing[product.id] ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isPurchasing[product.id] ? 'Processing...' : <>🛒 Purchase Now</>}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className='card' style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ margin: '0 0 1rem 0' }}>No products found</h3>
            <p style={{ color: '#666' }}>Check back later for new items!</p>
          </div>
        )}

        {/* Payment Methods */}
        <div className='card' style={{ marginTop: '2rem' }}>
          <h3>Accepted Payment Methods</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {['Mobile Money', 'Visa', 'Mastercard', 'Bank Transfer'].map(method => (
              <div
                key={method}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>💳</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{method}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            All transactions are secure and encrypted. We never store your payment details on our
            servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InAppPurchases;
