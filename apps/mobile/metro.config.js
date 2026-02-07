// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
// Check root node_modules first, then local
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Ensure extraNodeModules includes workspace packages
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}
// Add workspace packages
config.resolver.extraNodeModules['@hyve/types'] = path.resolve(monorepoRoot, 'packages/types/src');
config.resolver.extraNodeModules['@hyve/utils'] = path.resolve(monorepoRoot, 'packages/utils/src');

module.exports = config;
