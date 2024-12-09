const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/voice_chat', // 匹配的 API 路徑
        createProxyMiddleware({
            target: 'http://210.240.160.27:6969',
            changeOrigin: true,
        })
    );
};
