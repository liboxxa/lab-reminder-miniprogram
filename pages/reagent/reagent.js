const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    libraryList: [],
    libraryNameList: [],
    libraryIndex: 0,
    currentLibraryId: null,
    currentLibraryName: '',
    currentLibraryInviteCode: '',
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

  libraryFullList: [],

  onLoad() {},

  onShow() {
    if (!app.globalData.isLogin) {
      this.libraryFullList = [];
      this.setData({
        libraryList: [],
        libraryNameList: [],
        libraryIndex: 0,
        currentLibraryId: null,
        currentLibraryName: '',
        currentLibraryInviteCode: '',
        hasLoadedLibraries: true,
        reagentList: [],
        allReagentList: []
      });
      return;
    }
    this.loadLibraries();
  },

  onPullDownRefresh() {
    if (this.data.libraryList.length > 0 && this.data.currentLibraryId) {
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
      this.libraryFullList = list;
      const nameList = list.map(item => item.name || '未命名');
      this.setData({
        libraryList: list.map(item => ({
          id: item.id,
          name: item.name,
          inviteCode: item.inviteCode
        })),
        libraryNameList: nameList,
        hasLoadedLibraries: true
      });
      if (list.length > 0) {
        let index = 0;
        const cachedId = wx.getStorageSync('currentLibraryId');
        if (cachedId) {
          const found = list.findIndex(l => l.id == cachedId);
          if (found !== -1) index = found;
        }
        const current = list[index] || {};
        this.setData({
          libraryIndex: index,
          currentLibraryId: current.id || null,
          currentLibraryName: current.name || '',
          currentLibraryInviteCode: current.inviteCode || ''
        });
        if (current.id) {
          wx.setStorageSync('currentLibraryId', current.id);
        }
        this.loadReagentList();
      }
    }).catch(err => {
      console.error('获取试剂库列表失败:', err);
    });
  },

  onLibraryChange(e) {
    const index = e.detail.value;
    const lib = this.libraryFullList[index] || {};
    this.setData({
      libraryIndex: index,
      currentLibraryId: lib.id || null,
      currentLibraryName: lib.name || '',
      currentLibraryInviteCode: lib.inviteCode || ''
    });
    if (lib.id) {
      wx.setStorageSync('currentLibraryId', lib.id);
    }
    this.loadReagentList();
  },

  loadReagentList() {
    if (!this.data.currentLibraryId) return Promise.resolve();

    return api.getReagentList({
      libraryId: this.data.currentLibraryId,
      keyword: this.data.searchKey
    }).then(res => {
      const list = res.data || [];
      this.setData({
        allReagentList: list
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
    if (!this.data.currentLibraryId) return;
    wx.showLoading({ title: '正在生成文件...' });
    
    const token = wx.getStorageSync('token') || '';
    const url = api.getReagentExportUrl() + '?libraryId=' + this.data.currentLibraryId;
    
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

  showImportTip() {
    if (!this.data.currentLibraryId) {
      wx.showToast({ title: '请先选择试剂库', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '批量导入说明',
      content: '请上传Excel文件，包含以下列：name（必填）、unit（可选）、stockAmount（可选）、description（可选）。',
      confirmText: '选择文件',
      success: (res) => {
        if (res.confirm) {
          this.chooseImportFile();
        }
      }
    });
  },

  chooseImportFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        this.importReagentsFile(file.path);
      },
      fail: () => {
        wx.showToast({ title: '选择文件失败', icon: 'none' });
      }
    });
  },

  importReagentsFile(filePath) {
    wx.showLoading({ title: '导入中...' });
    api.importReagents(filePath, this.data.currentLibraryId).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '导入成功', icon: 'success' });
      this.loadReagentList();
    }).catch(err => {
      wx.hideLoading();
      console.error('导入失败:', err);
      wx.showToast({ title: '导入失败', icon: 'none' });
    });
  },

  goActions() {
    if (!this.data.currentLibraryId) {
      wx.showToast({ title: '请先选择试剂库', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/reagent/actions/actions?libraryId=${this.data.currentLibraryId}`
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
    if (!this.data.currentLibraryId) return;
    wx.navigateTo({
      url: `/pages/reagent/add/add?libraryId=${this.data.currentLibraryId}`
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
    if (!this.data.currentLibraryId) return;
    this.setData({ showMembersDialog: true, membersList: [] });
    api.getReagentLibraryMembers(this.data.currentLibraryId).then(res => {
      this.setData({ membersList: res.data || [] });
    });
  },

  closeMembersDialog() {
    this.setData({ showMembersDialog: false });
  },

  copyInviteCode() {
    if (!this.data.currentLibraryInviteCode) return;
    wx.setClipboardData({
      data: this.data.currentLibraryInviteCode,
      success: () => wx.showToast({ title: '邀请码已复制' })
    });
  }
});