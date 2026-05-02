const api = require('../../../utils/api');
const app = getApp();

Page({
  data: {
    libraryList: [],
    libraryNameList: [],
    libraryIndex: 0,
    currentLibraryId: null,
    currentLibraryName: '',

    actionOptions: ['', 'use', 'restock', 'create', 'adjust'],
    actionLabelList: ['全部', '使用', '入库', '创建', '调整'],
    actionIndex: 0,

    reagentName: '',
    // 改为实验名称
    experimentName: '',
    actions: []
  },

  onLoad(options) {
    if (options.libraryId) {
      this.setData({ currentLibraryId: options.libraryId });
    }
  },

  onShow() {
    if (!app.globalData.isLogin) return;
    this.loadLibraries();
  },

  loadLibraries() {
    api.getReagentLibraryList().then(res => {
      const list = res.data || [];
      const nameList = list.map(item => item.name || '未命名');
      let index = 0;
      if (this.data.currentLibraryId) {
        const found = list.findIndex(l => l.id == this.data.currentLibraryId);
        if (found !== -1) index = found;
      }
      const current = list[index] || {};
      this.setData({
        libraryList: list.map(item => ({ id: item.id, name: item.name })),
        libraryNameList: nameList,
        libraryIndex: index,
        currentLibraryId: current.id || null,
        currentLibraryName: current.name || ''
      });
      this.loadActions();
    }).catch(err => {
      console.error('获取试剂库列表失败:', err);
    });
  },

  onLibraryChange(e) {
    const index = parseInt(e.detail.value, 10);
    const lib = this.data.libraryList[index] || {};
    this.setData({
      libraryIndex: index,
      currentLibraryId: lib.id || null,
      currentLibraryName: lib.name || ''
    });
    this.loadActions();
  },

  onActionChange(e) {
    this.setData({ actionIndex: parseInt(e.detail.value, 10) });
  },

  onReagentNameInput(e) {
    this.setData({ reagentName: e.detail.value });
  },

  // 实验名称输入
  onExperimentInput(e) {
    this.setData({ experimentName: e.detail.value });
  },

  // 构建筛选参数（核心：实验名称筛选）
  buildQuery() {
    const action = this.data.actionOptions[this.data.actionIndex];
    return {
      libraryId: this.data.currentLibraryId,
      action: action || undefined,
      reagentName: this.data.reagentName.trim() || undefined,
      experimentName: this.data.experimentName.trim() || undefined
    };
  },

  // ✅ 优化加载方法：点击查询强制清空旧数据，重新请求
  loadActions() {
    if (!this.data.currentLibraryId) {
      this.setData({ actions: [] });
      return;
    }
    // 先清空数据，避免旧数据残留
    this.setData({ actions: [] });
    // 调用接口查询
    api.getReagentActions(this.buildQuery()).then(res => {
      this.setData({ actions: res.data || [] });
      // 无数据提示
      if (!res.data || res.data.length === 0) {
        wx.showToast({ title: '暂无操作记录', icon: 'none' });
      }
    }).catch(err => {
      console.error('获取操作记录失败:', err);
      wx.showToast({ title: '获取操作记录失败', icon: 'none' });
    });
  },

  // 导出功能（已自动适配实验名称筛选）
  exportActions() {
    if (!this.data.currentLibraryId) return;
    wx.showLoading({ title: '正在生成文件...' });
    const token = wx.getStorageSync('token') || '';
    const params = this.buildQuery();
    const query = Object.keys(params)
      .filter(k => params[k])
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
    const url = api.getReagentActionsExportUrl() + '?' + query;

    wx.downloadFile({
      url: url + '&token=' + token,
      header: { 'Authorization': 'Bearer ' + token },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            success: () => wx.hideLoading(),
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '打开文件失败', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  }
});