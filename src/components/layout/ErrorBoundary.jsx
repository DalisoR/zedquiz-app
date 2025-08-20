import PropTypes from 'prop-types';
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to an error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary'>
          <div className='error-content'>
            <h2>Something went wrong.</h2>
            {this.props.fallback || (
              <div>
                <p>We're sorry for the inconvenience. The error has been logged.</p>
                <button className='btn btn-primary' onClick={() => window.location.reload()}>
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
