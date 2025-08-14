// Google Analytics 4 Measurement ID
const MEASUREMENT_ID = 'G-RG84GQ8K5V'; // Replace with your actual GA4 Measurement ID

// Initialize Google Analytics
export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    // Load the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize the data layer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: true,
      transport_url: 'https://www.google-analytics.com',
      first_party_collection: true
    });

    console.log('Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', MEASUREMENT_ID, {
      page_path: path,
      page_title: document.title
    });
  }
};

// Track events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track form submissions
export const trackFormSubmission = (formName) => {
  trackEvent('form_submit', 'form', formName);
};

// Track button clicks
export const trackButtonClick = (buttonName) => {
  trackEvent('button_click', 'ui_interaction', buttonName);
};

// Track user sign up
export const trackSignUp = (method) => {
  trackEvent('sign_up', 'authentication', method);
};

// Track user login
export const trackLogin = (method) => {
  trackEvent('login', 'authentication', method);
};

const analytics = {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackFormSubmission,
  trackButtonClick,
  trackSignUp,
  trackLogin
};

export default analytics;
