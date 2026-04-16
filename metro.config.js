const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Disable package exports resolution to prevent Metro from resolving
// packages like zustand to their ESM/mjs builds which use import.meta.
// import.meta is illegal in non-module scripts that Metro outputs for web.
// With this off, Metro uses the traditional 'main' field (CJS) instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
