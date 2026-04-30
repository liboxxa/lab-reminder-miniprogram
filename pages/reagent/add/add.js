const api = require('../../../utils/api');

Page({
  data: {
    formData: {
      name: '',
      description: '',
      unit: '',
      stockAmount: ''
    },
    isEdit: false,
    editId: '',
    libraryId: ''
  },

  onLoad(options) {
    if (options.libraryId) {
      this.setData({ libraryId: options.libraryId });
    }
    
    if (options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑试剂' });
      this.loadDetail(options.id);
    }
  },

  loadDetail(id) {
    api.getReagentDetail(id).then(res => {
      const r = res.data;
      this.setData({
        formData: {
          name: r.name || '',
          description: r.description || '',
          unit: r.unit || '',
          stockAmount: r.stockAmount || ''
        }
      });
    }).catch(err => {
      console.error('获取试剂详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  submit() {
    const { formData, isEdit, editId } = this.data;
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入试剂名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const data = {
      name: formData.name.trim(),
      description: formData.description,
      unit: formData.unit,
      stockAmount: formData.stockAmount ? Number(formData.stockAmount) : 0,
      libraryId: this.data.libraryId || wx.getStorageSync('currentLibraryId')
    };

    const req = isEdit
      ? api.updateReagent(editId, data)
      : api.createReagent(data);

    req.then(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('保存试剂失败:', err);
    });
  }
});