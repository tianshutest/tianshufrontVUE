module.exports = {
  devServer: {
    proxy: {
      '/tianshu': {
        target: 'http://127.0.0.1:51385',  // 后端 API 地址
        changeOrigin: true,  // 允许跨域
        secure: false,  // 如果后端使用的是 http 协议，这里设置为 false
        pathRewrite: {
          '^/tianshu': ''  // 如果后端路径有前缀，可以在这里去掉
        }
      }
    }
  }
};
