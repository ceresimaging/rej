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
    output: {
      /* TODO: DOES IT STILL BUILD WITHOUT THIS? */
      /* libraryTarget: "commonjs2" */
    },
    optimization: {
      // Don't minimize: lets let jupyterlab handle this
      minimize: false,
    },
    resolve: {
      alias: {
        'babel-runtime': '@babel/runtime'
      },
      symlinks: false
    },
    plugins: [
    ],
    externals: [
      /^@jupyter-widgets\/.+$/,
      /^@jupyterlab\/.+$/,
      /^@lumino\/.+$/,
    ]   
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
      analyzerPort: 7676,
      analyzerMode: "disabled"
    }
  },
}