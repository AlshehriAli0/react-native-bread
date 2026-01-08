const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../..");

const config = getDefaultConfig(projectRoot);

// Watch the library source directory
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force resolving nested modules to the versions in example's node_modules
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
