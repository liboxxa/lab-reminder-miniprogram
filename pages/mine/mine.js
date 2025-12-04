const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    userInfo: {},
    settings: {
      defaultRemindTime: '09:00',
      intervalIndex: 1,
      maxRepeatIndex: 2
    },
    intervalOptions: [
      { label: '30分钟', value: 30 },
      { label: '1小时', value: 60 },
      { label: '2小时', value: 120 },
      { label: '4小时', value: 240 }
    ],
    maxRepeatOptions: [1, 2, 3, 5, 10]
  },

  onLoad() {
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ 
        userInfo,
        settings: {
          defaultRemindTime: userInfo.defaultRemindTime || '09:00',
          intervalIndex: this.findIntervalIndex(userInfo.remindInterval || 60),
          maxRepeatIndex: this.findMaxRepeatIndex(userInfo.maxRepeat || 3)
        }
      });
    }
  },

  // 查找间隔索引
  findIntervalIndex(value) {
    const index = this.data.intervalOptions.findIndex(o => o.value === value);
    return index >= 0 ? index : 1;
  },

  // 查找最大提醒次数索引
  findMaxRepeatIndex(value) {
    const index = this.data.maxRepeatOptions.indexOf(value);
    return index >= 0 ? index : 2;
  },

  // 修改提醒时间
  onTimeChange(e) {
    const settings = this.data.settings;
    settings.defaultRemindTime = e.detail.value;
    this.setData({ settings });
    this.saveSettings();
  },

  // 修改重复间隔
  onIntervalChange(e) {
    const settings = this.data.settings;
    settings.intervalIndex = e.detail.value;
    this.setData({ settings });
    this.saveSettings();
  },

  // 修改最大提醒次数
  onMaxRepeatChange(e) {
    const settings = this.data.settings;
    settings.maxRepeatIndex = e.detail.value;
    this.setData({ settings });
    this.saveSettings();
  },

  // 保存设置
  saveSettings() {
    const { settings, intervalOptions, maxRepeatOptions } = this.data;
    
    api.updateSettings({
      defaultRemindTime: settings.defaultRemindTime,
      remindInterval: intervalOptions[settings.intervalIndex].value,
      maxRepeat: maxRepeatOptions[settings.maxRepeatIndex]
    }).then(() => {
      wx.showToast({ title: '设置已保存', icon: 'success' });
      // 更新本地用户信息
      this.loadUserInfo();
    }).catch(err => {
      console.error('保存设置失败:', err);
    });
  },

  // 跳转登录
  goLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 编辑资料
  editProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 跳转团队
  goGroup() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/group/group'
    });
  },

  // 跳转模板
  goTemplate() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/template/template'
    });
  },

  // 数据导出
  goExport() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '实验提醒助手',
      content: '版本 1.0.0\n帮助科研人员管理实验进程\n\n开发：实验室团队',
      showCancel: false
    });
  },

  // 意见反馈
  feedback() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({ userInfo: {} });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});