const merge = require('webpack-merge');
const DefinePlugin = require('webpack').DefinePlugin;

module.exports = defaultConfig => {
    return merge.smart(defaultConfig, {
        plugins: [
            new DefinePlugin({
                'process.env.TW_ENABLE_UPDATE_CHECKER': JSON.stringify(process.env.TW_ENABLE_UPDATE_CHECKER),
            })
        ]
    });
};
