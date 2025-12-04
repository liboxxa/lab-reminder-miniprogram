const api = require('../../../utils/api');

Page({
  data: {
    strainId: '',
    strainInfo: {
      name: '',
      description: '',
      source: '',
      storageLocation: '',
      conditions: { temperature: '', medium: '', other: '' },
      isShared: false,
      createdAt: ''
    },
    operationLogs: [],
    relatedExperiments: [],
    showLogModal: false,
    newLog: {
      content: '',
      images: []
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ strainId: options.id });
    }
  },

  onShow() {
    if (this.data.strainId) {
      this.loadStrainDetail(this.data.strainId);
    }
  },

  // 加载菌种详情
  loadStrainDetail(id) {
    api.getStrainDetail(id).then(res => {
      const data = res.data;
      this.setData({
        strainInfo: {
          name: data.name || '',
          description: data.description || '',
          source: data.source || '',
          storageLocation: data.storageLocation || '',
          conditions: data.conditions || { temperature: '', medium: '', other: '' },
          isShared: data.isShared || false,
          createdAt: data.createdAt ? data.createdAt.split('T')[0] : ''
        },
        operationLogs: data.operationLogs || [],
        relatedExperiments: data.relatedExperiments || []
      });
      wx.setNavigationBarTitle({ title: data.name });
    }).catch(err => {
      console.error('获取菌种详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  // 打开添加记录弹窗
  addLog() {
    this.setData({
      showLogModal: true,
      newLog: { content: '', images: [] }
    });
  },

  // 关闭弹窗
  closeLogModal() {
    this.setData({ showLogModal: false });
  },

  // 输入记录内容
  onLogInput(e) {
    this.setData({
      'newLog.content': e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.newLog.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          'newLog.images': [...this.data.newLog.images, ...newImages]
        });
      }
    });
  },

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.newLog.images;
    images.splice(index, 1);
    this.setData({ 'newLog.images': images });
  },

  // 提交记录
  submitLog() {
    const { newLog, strainId } = this.data;

    if (!newLog.content.trim() && newLog.images.length === 0) {
      wx.showToast({
        title: '请输入内容或添加图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    api.addStrainLog(strainId, {
      content: newLog.content,
      images: newLog.images
    }).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '记录已保存', icon: 'success' });
      this.setData({ showLogModal: false });
      this.loadStrainDetail(strainId);
    }).catch(err => {
      wx.hideLoading();
      console.error('保存记录失败:', err);
    });
  },

  // 预览图片
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ urls, current });
  },

  // 编辑菌种
  editStrain() {
    wx.navigateTo({
      url: `/pages/strain/add/add?id=${this.data.strainId}`
    });
  },

  // 创建实验
  createExperiment() {
    wx.navigateTo({
      url: `/pages/experiment/add/add?strainId=${this.data.strainId}`
    });
  },

  // 删除菌种
  deleteStrain() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个菌种吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.deleteStrain(this.data.strainId).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }).catch(err => {
            console.error('删除失败:', err);
          });
        }
      }
    });
  },

  // 跳转实验详情
  goExperiment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/experiment/detail/detail?id=${id}`
    });
  }
});