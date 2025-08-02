const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithAudioAPIMetroConfig } = require('react-native-audio-api/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = wrapWithAudioAPIMetroConfig(config);
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
