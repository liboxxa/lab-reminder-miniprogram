const api = require('../../../utils/api');

Page({
  data: {
    id: '',
    reagent: {
      name: '',
      description: '',
      unit: '',
      stockAmount: '',
      isShared: false,
      createdAt: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail(options.id);
    }
  },

  onShow() {
    if (this.data.id) {
      this.loadDetail(this.data.id);
    }
  },

  loadDetail(id) {
    api.getReagentDetail(id).then(res => {
      const r = res.data;
      this.setData({
        reagent: {
          name: r.name || '',
          description: r.description || '',
          unit: r.unit || '',
          stockAmount: r.stockAmount || '',
          isShared: r.isShared || false,
          createdAt: r.createdAt ? r.createdAt.split('T')[0] : ''
        }
      });
      wx.setNavigationBarTitle({ title: r.name });
    }).catch(err => {
      console.error('获取试剂详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  editReagent() {
    wx.navigateTo({
      url: `/pages/reagent/add/add?id=${this.data.id}`
    });
  },

  deleteReagent() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个试剂吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.deleteReagent(this.data.id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }).catch(err => {
            console.error('删除试剂失败:', err);
          });
        }
      }
    });
  }
});