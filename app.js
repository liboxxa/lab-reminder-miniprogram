const api = require('./utils/api');

App({
  globalData: {
    userInfo: null,
    isLogin: false
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.isLogin = true;
      this.globalData.userInfo = userInfo;
      
      // 验证token是否有效
      api.getUserInfo().then(res => {
        this.globalData.userInfo = res.data;
        wx.setStorageSync('userInfo', res.data);
      }).catch(() => {
        // token无效，清除登录状态
        this.logout();
      });
    }
  },

  // 登录
  login(userProfile) {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            api.login(loginRes.code, userProfile).then(res => {
              // 保存token和用户信息
              wx.setStorageSync('token', res.data.token);
              wx.setStorageSync('userInfo', res.data.userInfo);
              
              this.globalData.isLogin = true;
              this.globalData.userInfo = res.data.userInfo;
              
              resolve(res.data);
            }).catch(reject);
          } else {
            reject(new Error('获取code失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.globalData.isLogin = false;
    this.globalData.userInfo = null;
  }
});