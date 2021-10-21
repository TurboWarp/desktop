const merge = require('webpack-merge');
const DefinePlugin = require('webpack').DefinePlugin;

module.exports = defaultConfig => {
    return merge.smart(defaultConfig, {
        plugins: process.env.TW_ENABLE_UPDATE_CHECKER ? [
            new DefinePlugin({
                'process.env.TW_ENABLE_UPDATE_CHECKER': '"1"'
            })
        ] : []
    });
};
