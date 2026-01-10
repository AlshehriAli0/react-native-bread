const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const packageRoot = path.resolve(workspaceRoot, "packages/react-native-bread");
const packageSrc = path.resolve(packageRoot, "src");

const config = getDefaultConfig(projectRoot);

// Watch the library source directory
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force resolve react-native-bread to source directory for hot reload
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-bread imports to source
  if (moduleName === "react-native-bread") {
    return {
      filePath: path.resolve(packageSrc, "index.ts"),
      type: "sourceFile",
    };
  }
  if (moduleName.startsWith("react-native-bread/")) {
    const subPath = moduleName.replace("react-native-bread/", "");
    return {
      filePath: path.resolve(packageSrc, subPath),
      type: "sourceFile",
    };
  }

  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
