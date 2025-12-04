const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    currentTab: 'ongoing',
    experimentList: []
  },

  onLoad() {
  },

  onShow() {
    this.loadExperimentList();
  },
// 下拉刷新
onPullDownRefresh() {
  this.loadExperimentList().finally(() => {
    wx.stopPullDownRefresh();
  });
},
  // 加载实验列表（改成返回 Promise）
  loadExperimentList() {
    if (!app.globalData.isLogin) {
      this.setData({ experimentList: [] });
      return Promise.resolve();
    }

    return api.getExperimentList({ tab: this.data.currentTab }).then(res => {
      this.setData({
        experimentList: res.data || []
      });
    }).catch(err => {
      console.error('获取实验列表失败:', err);
    });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.loadExperimentList();
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/experiment/detail/detail?id=${id}`
    });
  },

  // 跳转添加
  goAdd() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/experiment/add/add'
    });
  }
});