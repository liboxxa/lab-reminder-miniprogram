const api = require('../../utils/api');
const app = getApp();
const config = require('../../utils/config'); // 引入 config 方便拼 URL
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
    const that = this;
    wx.showModal({
        title: '修改昵称',
        editable: true,
        placeholderText: '请输入新的昵称',
        content: this.data.userInfo.nickname || '', // 注意：真机上content不可编辑，editable才是输入框
      success(res) {
        if (res.confirm) {
          const newNick = res.content.trim();
          if (!newNick) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' });
            return;
          }
          api.updateProfile({ nickname: newNick }).then(() => {
            const userInfo = { ...that.data.userInfo, nickname: newNick };
            that.setData({ userInfo });
            wx.setStorageSync('userInfo', userInfo);
            wx.showToast({ title: '昵称已更新', icon: 'success' });
          }).catch(err => {
            console.error('更新昵称失败:', err);
          });
        }
      }
    });
  },
// 更换头像
changeAvatar() {
  const that = this;
  if (!app.globalData.isLogin) {
    wx.navigateTo({ url: '/pages/login/login' });
    return;
  }

  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success(res) {
      const tempFilePath = res.tempFiles[0].tempFilePath;
      
      wx.showLoading({ title: '上传中...' });

      // 1. 上传图片
      api.uploadFile(tempFilePath).then(data => {
        // data.url 是相对路径 /public/..., 我们需要拼成完整 URL 或直接存
        // 这里建议存完整 URL 到数据库，或者前端显示时拼域名
        // 简单起见，我们假设后端返回相对路径，前端补全显示
        // 但为了 updateProfile 方便，我们最好存完整 URL
        
        // 如果后端返回的是 /public/...，我们需要拼上域名
        // 或者是让后端直接返回完整 URL
        // 这里我们在前端拼一下：
        let fullUrl = data.url;
        if (fullUrl.startsWith('/')) {
          // 去掉 config.baseUrl 里的 /api
          const domain = config.baseUrl.replace('/api', '');
          fullUrl = domain + fullUrl;
        }

        // 2. 更新用户信息（写入数据库）
        api.updateProfile({ avatar: fullUrl }).then(() => {
          // 3. 更新本地显示
          const userInfo = { ...that.data.userInfo, avatar: fullUrl };
          that.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          app.globalData.userInfo = userInfo;

          wx.hideLoading();
          wx.showToast({ title: '头像已更新', icon: 'success' });
        });
      }).catch(err => {
        wx.hideLoading();
        console.error('上传失败', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      });
    }
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
  goReagent() {
    if (!this.data.userInfo.id) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/reagent/reagent'
    });
  },
    // 数据导出
    goExport() {
      if (!app.globalData.isLogin) {
        wx.navigateTo({ url: '/pages/login/login' });
        return;
      }
  
      wx.showLoading({ title: '正在生成...' });
  
      const token = wx.getStorageSync('token');
      const url = api.getExportUrl();
  
      // 微信下载文件
      wx.downloadFile({
        url: url,
        header: {
          'Authorization': 'Bearer ' + token
        },
        success(res) {
          if (res.statusCode === 200) {
            const filePath = res.tempFilePath;
            
            // 打开文件（支持转发给朋友）
            wx.openDocument({
              filePath: filePath,
              showMenu: true, // 显示右上角菜单，方便转发
              success: function () {
                console.log('打开文档成功');
                wx.hideLoading();
              },
              fail: function (err) {
                console.error('打开文档失败', err);
                wx.hideLoading();
                wx.showToast({ title: '无法打开文件', icon: 'none' });
              }
            });
          } else {
            wx.hideLoading();
            wx.showToast({ title: '导出失败', icon: 'none' });
          }
        },
        fail(err) {
          wx.hideLoading();
          console.error('下载失败', err);
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '实验提醒助手',
      content: '版本 1.3.0\n帮助科研人员管理实验进程\n\n开发：实验室团队',
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