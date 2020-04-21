process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  // Its possible we want this to support <template> tags in .vue files:
  // https://cli.vuejs.org/config/#runtimecompiler
  // But if vue works without it, lets nix it (Apr 7, 2020)
  runtimeCompiler: true,

  configureWebpack: {
    /* This is essential to not have b0rken external imports :-/
      without this, webpack was wrapping external commonjs require() statements
      in an eval(), which was breaking juplab's webpack from recognizing and
      replacing the requires. Its possible we could use some non-eval devtool setting?
      */
    devtool: "none",
    resolve: {
      alias: {
        'babel-runtime': '@babel/runtime'
      },
      symlinks: false
    },
    externals: [
      /^@jupyter-widgets\/.+$/,
      /^@jupyterlab\/.+$/,
      /^@lumino\/.+$/,
    ],
  },
}