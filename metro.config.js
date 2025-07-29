// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      // Ensure crypto and buffer polyfills work in release builds
      crypto: 'react-native-crypto',
      stream: 'readable-stream',
      buffer: '@craftzdog/react-native-buffer',
    },
  },
  transformer: {
    // Enable minification in release mode
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);