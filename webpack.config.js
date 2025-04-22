const path = require("path");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var WebpackObfuscator = require('webpack-obfuscator');

//set the environment
const env = process.env.NODE_ENV || "production";
const DO_OBFUSCATE = process.env.DO_OBFUSCATE || false;

let plugins = [new ForkTsCheckerWebpackPlugin()];

if (env === "production" && DO_OBFUSCATE) {
  plugins.push(new WebpackObfuscator({
    rotateStringArray: true
  }));
}

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.json"),
            transpileOnly: true,
          },
        },
      },
    ],
  },
  plugins,
  resolve: {
    extensions: [".ts"],
    symlinks: false,
    cacheWithContext: false,
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: env,
  devtool: env === "development" ? "eval" : false,
  watchOptions: {
    aggregateTimeout: 300,
    ignored: /node_modules/
  }
};
