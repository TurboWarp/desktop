const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');

const addonFolder = path.resolve(__dirname, 'src', 'addons', 'addons');
const rawLibrariesFolder = path.resolve(__dirname, 'src', 'addons', 'libraries-raw');

module.exports = defaultConfig => {
    defaultConfig.module.rules = [];
    return merge.smart(defaultConfig, {
        devtool: '',
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    loader: 'babel-loader',
                    exclude: [
                        rawLibrariesFolder
                    ],
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                },
                {
                    test: /\.(svg|png|wav|gif|jpg|mp3)$/,
                    loader: 'file-loader',
                    exclude: [
                        addonFolder
                    ],
                    options: {
                        outputPath: 'static/assets/'
                    }
                },
                {
                    test: /\.css$/,
                    exclude: [
                        addonFolder
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
                },
                {
                    test: /\.css$/,
                    include: [
                        addonFolder
                    ],
                    loader: 'raw-loader'
                },
                {
                    test: /\.svg$/,
                    include: [
                        addonFolder
                    ],
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        context: addonFolder,
                        outputPath: 'addon-files'
                    }
                }
            ],
        },
        plugins: [
            new CopyWebpackPlugin([
                {
                    from: 'node_modules/scratch-blocks/media',
                    to: 'static/blocks-media'
                },
                {
                    from: rawLibrariesFolder,
                    to: 'addon-files/libraries-raw'
                },
                {
                    from: 'library-files',
                    to: 'library-files'
                }
                // TODO: copy extension worker?
            ])
        ],
        resolve: {
            alias: {
                'scratch-gui$': path.resolve(__dirname, 'node_modules', 'scratch-gui', 'src', 'index.js')
            }
        }
    });
};
