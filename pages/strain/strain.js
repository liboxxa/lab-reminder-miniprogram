const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    currentTab: 'all',
    searchKey: '',
    strainList: []
  },

  onLoad() {
  },

  onShow() {
    this.loadStrainList();
  },
// 下拉刷新
onPullDownRefresh() {
  this.loadStrainList().finally(() => {
    wx.stopPullDownRefresh();
  });
},

// 加载菌种列表（改成返回 Promise）
loadStrainList() {
  if (!app.globalData.isLogin) {
    this.setData({ strainList: [] });
    return Promise.resolve();
  }

  return api.getStrainList({
    tab: this.data.currentTab,
    keyword: this.data.searchKey
  }).then(res => {
    this.setData({
      strainList: res.data || []
    });
  }).catch(err => {
    console.error('获取菌种列表失败:', err);
  });
},

  // 搜索
  onSearch(e) {
    this.setData({
      searchKey: e.detail.value
    });
    this.loadStrainList();
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.loadStrainList();
  },

  // 跳转详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/strain/detail/detail?id=${id}`
    });
  },

  // 跳转添加页面
  goAdd() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/strain/add/add'
    });
  }
});