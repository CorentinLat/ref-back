const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = config => {
    config.target = 'electron-renderer';

    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin({
			  excludeAliases: ['console']
		})
    ];

    return config;
}
