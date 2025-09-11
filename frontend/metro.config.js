const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.resolver.platforms = ['web', 'ios', 'android'];

// Network configuration
config.server = {
  ...config.server,
  host: '192.168.1.10',
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle OPTIONS requests
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
      } else {
        middleware(req, res, next);
      }
    };
  },
};

// Increase timeout for better stability
config.server.port = 8000;
config.resolver.assetExts = [...config.resolver.assetExts, 'db'];

module.exports = config;