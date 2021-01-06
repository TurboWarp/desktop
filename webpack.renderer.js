const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');

module.exports = defaultConfig => {
    defaultConfig.module.rules = [];
    return merge.smart(defaultConfig, {
        devtool: '',
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                },
                {
                    test: /\.(svg|png|wav|gif|jpg|mp3)$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'static/assets/'
                    }
                },
                {
                    test: /\.css$/,
                    include: [
                        path.resolve(__dirname, 'src', 'addons')
                    ],
                    loader: 'raw-loader'
                },
                {
                    test: /\.css$/,
                    exclude: [
                        path.resolve(__dirname, 'src', 'addons')
                    ],
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                modules: {
                                    localIdentName: '[name]_[local]_[hash:base64:5]',
                                    exportLocalsConvention: 'camelCase'
                                }
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        'autoprefixer',
                                        'postcss-import',
                                        'postcss-simple-vars'
                                    ]
                                }
                            }
                        }
                    ]
                }
            ],
        },
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'node_modules/scratch-blocks/media',
                    to: 'static/blocks-media'
                },
                // TODO: don't copy everything, only images, svg, etc.
                // TODO: use file-loader?
                {
                    from: 'src/addons/addons',
                    to: 'addon-files',
                },
                // TODO: copy extension worker?
            ])
        ],
        resolve: {
            // cacheWithContext: false,
            // symlinks: false,
            alias: {
                'scratch-gui$': path.resolve(__dirname, 'node_modules', 'scratch-gui', 'src', 'index.js')
            }
        }
    });
};
