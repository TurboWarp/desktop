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
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                        plugins: ['@babel/plugin-proposal-optional-chaining']
                    }
                },
                {
                    test: /\.(svg|png|wav|gif|jpg|mp3|ttf|otf)$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'static/assets/',
                        esModule: false
                    }
                },
                {
                    test: /\.css$/,
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
                }
            ])
        ],
        resolve: {
            alias: {
                'scratch-gui$': path.resolve(__dirname, 'node_modules', 'scratch-gui', 'src', 'index.js'),
                'scratch-render-fonts$': path.resolve(__dirname, 'node_modules', 'scratch-gui', 'src', 'lib', 'tw-scratch-render-fonts'),
            }
        },
        output: {
            libraryTarget: 'var'
        },
        target: 'web'
    });
};
