const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve package entrypoints from compiled files.
// This avoids broken "source" fields from some dependencies.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-maps') {
    if (platform === 'web') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/shims/react-native-maps.web.js'),
      };
    }
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'node_modules/react-native-maps/lib/index.js'),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
