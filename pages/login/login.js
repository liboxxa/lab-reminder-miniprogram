const app = getApp();

Page({
  data: {
    showPhoneLogin: false,
    phone: '',
    code: '',
    countdown: 0,
    agreed: false
  },

  // 微信登录
  wechatLogin() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (profileRes) => {
        app.login(profileRes.userInfo).then(data => {
          wx.hideLoading();
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack({
              fail: () => {
                wx.switchTab({ url: '/pages/index/index' });
              }
            });
          }, 1500);
        }).catch(err => {
          wx.hideLoading();
          console.error('登录失败:', err);
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '需要授权才能登录',
          icon: 'none'
        });
      }
    });
  },

  // 切换手机号登录
  togglePhoneLogin() {
    this.setData({
      showPhoneLogin: !this.data.showPhoneLogin
    });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入验证码
  onCodeInput(e) {
    this.setData({
      code: e.detail.value
    });
  },

  // 发送验证码（暂未实现）
  sendCode() {
    if (this.data.countdown > 0) return;

    const phone = this.data.phone;
    if (!phone || phone.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 手机号登录（暂未实现）
  phoneLogin() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 切换同意协议
  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    });
  },

  // 显示用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议内容...',
      showCancel: false
    });
  },

  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策内容...',
      showCancel: false
    });
  }
});