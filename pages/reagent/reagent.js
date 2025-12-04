const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    currentTab: 'all',
    searchKey: '',
    reagentList: []
  },

  onLoad() {},

  onShow() {
    this.loadReagentList();
  },

  onPullDownRefresh() {
    this.loadReagentList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadReagentList() {
    if (!app.globalData.isLogin) {
      this.setData({ reagentList: [] });
      return Promise.resolve();
    }

    return api.getReagentList({
      tab: this.data.currentTab,
      keyword: this.data.searchKey
    }).then(res => {
      this.setData({
        reagentList: res.data || []
      });
    }).catch(err => {
      console.error('获取试剂列表失败:', err);
    });
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value });
    this.loadReagentList();
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.loadReagentList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/reagent/detail/detail?id=${id}`
    });
  },

  goAdd() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/reagent/add/add'
    });
  }
});