const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    libraryList: [],
    libraryIndex: 0,
    currentLibrary: null,
    hasLoadedLibraries: false,
    
    searchKey: '',
    reagentList: [],
    allReagentList: [],
    showZeroStock: false,

    showDialog: false,
    dialogType: 'create', // 'create' | 'join'
    dialogInputValue: '',

    showMembersDialog: false,
    membersList: []
  },

  onLoad() {},

  onShow() {
    if (!app.globalData.isLogin) {
      this.setData({ libraryList: [], hasLoadedLibraries: true, reagentList: [], allReagentList: [] });
      return;
    }
    this.loadLibraries();
  },

  onPullDownRefresh() {
    if (this.data.libraryList.length > 0) {
      this.loadReagentList().finally(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      this.loadLibraries().finally(() => {
        wx.stopPullDownRefresh();
      });
    }
  },

  loadLibraries() {
    return api.getReagentLibraryList().then(res => {
      const list = res.data || [];
      this.setData({ libraryList: list, hasLoadedLibraries: true });
      if (list.length > 0) {
        let index = 0;
        const cachedId = wx.getStorageSync('currentLibraryId');
        if (cachedId) {
          const found = list.findIndex(l => l.id == cachedId);
          if (found !== -1) index = found;
        }
        this.setData({ libraryIndex: index, currentLibrary: list[index] });
        wx.setStorageSync('currentLibraryId', list[index].id);
        this.loadReagentList();
      }
    }).catch(err => {
      console.error('获取试剂库列表失败:', err);
    });
  },

  onLibraryChange(e) {
    const index = e.detail.value;
    const lib = this.data.libraryList[index];
    this.setData({ libraryIndex: index, currentLibrary: lib });
    wx.setStorageSync('currentLibraryId', lib.id);
    this.loadReagentList();
  },

  loadReagentList() {
    if (!this.data.currentLibrary) return Promise.resolve();

    return api.getReagentList({
      libraryId: this.data.currentLibrary.id,
      keyword: this.data.searchKey
    }).then(res => {
      this.setData({
        allReagentList: res.data || []
      });
      this.filterList();
    }).catch(err => {
      console.error('获取试剂列表失败:', err);
    });
  },

  filterList() {
    let list = this.data.allReagentList;
    if (this.data.showZeroStock) {
      list = list.filter(item => item.stockAmount <= 0);
    }
    this.setData({ reagentList: list });
  },

  toggleZeroStock() {
    this.setData({ showZeroStock: !this.data.showZeroStock });
    this.filterList();
  },

  exportExcel() {
    if (!this.data.currentLibrary) return;
    wx.showLoading({ title: '正在生成文件...' });
    
    const token = wx.getStorageSync('token') || '';
    const url = api.getReagentExportUrl() + '?libraryId=' + this.data.currentLibrary.id;
    
    wx.downloadFile({
      url: url + '&token=' + token, // 同时在URL和Header里带上token
      header: {
        'Authorization': 'Bearer ' + token
      },
      success: function (res) {
        if (res.statusCode === 200) {
          const filePath = res.tempFilePath;
          wx.openDocument({
            filePath: filePath,
            showMenu: true, // 允许用户保存或转发文件
            fileType: 'xlsx', // 指定文件类型
            success: function () {
              wx.hideLoading();
              console.log('打开文档成功');
            },
            fail: function (err) {
              wx.hideLoading();
              console.error('打开文档失败', err);
              wx.showToast({
                title: '打开文件失败，请重试',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          console.error('文件下载失败，服务端返回:', res);
          wx.showToast({
            title: '下载失败 状态码:' + res.statusCode,
            icon: 'none'
          });
        }
      },
      fail: function (err) {
        wx.hideLoading();
        console.error('下载失败', err);
        wx.showToast({
          title: '网络错误，下载失败',
          icon: 'none'
        });
      }
    });
  },

  onSearch(e) {
    this.setData({ searchKey: e.detail.value });
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
      url: `/pages/reagent/add/add?libraryId=${this.data.currentLibrary.id}`
    });
  },

  showCreateDialog() {
    this.setData({ showDialog: true, dialogType: 'create', dialogInputValue: '' });
  },

  showJoinDialog() {
    this.setData({ showDialog: true, dialogType: 'join', dialogInputValue: '' });
  },

  closeDialog() {
    this.setData({ showDialog: false });
  },

  onDialogInput(e) {
    this.setData({ dialogInputValue: e.detail.value });
  },

  confirmDialog() {
    const val = this.data.dialogInputValue.trim();
    if (!val) return wx.showToast({ title: '内容不能为空', icon: 'none' });
    
    wx.showLoading({ title: '请求中...' });
    const req = this.data.dialogType === 'create' 
      ? api.createReagentLibrary(val) 
      : api.joinReagentLibrary(val);
      
    req.then(() => {
      wx.hideLoading();
      wx.showToast({ title: '成功', icon: 'success' });
      this.closeDialog();
      this.loadLibraries();
    }).catch(() => wx.hideLoading());
  },

  showMembers() {
    if (!this.data.currentLibrary) return;
    this.setData({ showMembersDialog: true, membersList: [] });
    api.getReagentLibraryMembers(this.data.currentLibrary.id).then(res => {
      this.setData({ membersList: res.data || [] });
    });
  },

  closeMembersDialog() {
    this.setData({ showMembersDialog: false });
  },

  copyInviteCode() {
    if (!this.data.currentLibrary || !this.data.currentLibrary.inviteCode) return;
    wx.setClipboardData({
      data: this.data.currentLibrary.inviteCode,
      success: () => wx.showToast({ title: '邀请码已复制' })
    });
  }
});