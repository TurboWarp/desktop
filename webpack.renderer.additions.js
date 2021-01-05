const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: '',
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'node_modules/scratch-gui/dist/static',
        to: 'static'
      },
      {
        from: 'node_modules/scratch-blocks/media',
        to: 'static/blocks-media'
      },
      // TODO: don't copy everything, only images, svg, etc.
      {
        from: 'src/addons/addons',
        to: 'addon-files',
      }
    ])
  ]
};
