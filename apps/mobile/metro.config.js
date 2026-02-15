// Learn more https://docs.expo.dev/guides/customizing-metro
// SDK 54+ auto-configures monorepos; manual watchFolders/nodeModulesPaths/disableHierarchicalLookup removed
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
