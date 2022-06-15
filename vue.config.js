const path = require("path");
// vue.config.js
module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: false
    }
  },
  css: {
    extract: false,
  },
  devServer: {
    proxy: 'http://localhost:3001'
  },
  outputDir: path.resolve(__dirname, "./foreground")
}
