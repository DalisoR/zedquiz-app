module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallback for .mjs files to use .js instead
      webpackConfig.resolve.extensions = ['.js', '.jsx', '.json'];
      
      // Ensure we're using the main field for module resolution
      webpackConfig.resolve.mainFields = ['browser', 'main', 'module'];
      
      // Add alias to force using CommonJS version of react-router-dom
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-router-dom': require.resolve('react-router-dom')
      };
      
      return webpackConfig;
    }
  }
};
