const { default: commonjs } = require("@rollup/plugin-commonjs");
const { default: nodeResolve } = require("@rollup/plugin-node-resolve");
const cleanup = require("rollup-plugin-cleanup");

let version = "";
if (process.env.npm_package_version)
  version = process.env.npm_package_version.replace(/\./g, "_");

module.exports = {
  input: "dist/index.js",
  output: {
    file: `dist/threadDownloader${version}.cjs`,
    format: "cjs",
  },
  plugins: [
    nodeResolve(),
    commonjs({ defaultIsModuleExports: true }),
    cleanup(),
  ],
  external: ["fs", "https"],
};
