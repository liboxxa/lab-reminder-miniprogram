// 服务器配置
const config = {
  // 开发环境使用本地地址
  // 注意：真机调试需要使用电脑的局域网IP，不能用localhost
  baseUrl: 'https://aixlab.online/api',
  
  // 如果用真机调试，改成你电脑的IP地址，比如：
  // baseUrl: 'http://192.168.1.100:3000/api',
  
  // 上线后改成你的服务器地址：
  // baseUrl: 'https://your-domain.com/api',
};

module.exports = config;