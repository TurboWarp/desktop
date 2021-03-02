const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');

const libraryFilesFolder = path.resolve(__dirname, 'library-files');
if (!fs.existsSync(libraryFilesFolder)) {
    fs.mkdirSync(libraryFilesFolder);
}

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
                },
                {
                    from: libraryFilesFolder,
                    to: 'library-files'
                }
                // TODO: copy extension worker?
            ])
        ],
        resolve: {
            alias: {
                'scratch-gui$': path.resolve(__dirname, 'node_modules', 'scratch-gui', 'src', 'index.js')
            }
        },
        output: {
            libraryTarget: 'var'
        },
        target: 'web'
    });
};
