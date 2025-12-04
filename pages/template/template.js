const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    groupedTemplates: [],   // [{ type: '涂布培养', list: [...], ...]
    showDetailModal: false,
    currentTemplate: null
  },

  onLoad() {},

  onShow() {
    this.loadTemplates();
  },

  loadTemplates() {
    api.getTemplateList().then(res => {
      const myTemplates = res.data.myTemplates || [];
      // 分组
      const groupMap = {};
      myTemplates.forEach(t => {
        const type = t.type || '未分类';
        if (!groupMap[type]) groupMap[type] = [];
        groupMap[type].push(t);
      });
      const groupedTemplates = Object.keys(groupMap).map(type => ({
        type,
        list: groupMap[type]
      }));
  
      this.setData({
        groupedTemplates
      });
    }).catch(err => {
      console.error('获取模板列表失败:', err);
    });
  },

  viewTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      showDetailModal: true,
      currentTemplate: template
    });
  },

  closeDetailModal() {
    this.setData({
      showDetailModal: false,
      currentTemplate: null
    });
  },

  useTemplate() {
    const template = this.data.currentTemplate;
    this.closeDetailModal();
    wx.navigateTo({
      url: `/pages/experiment/add/add?templateId=${template.id}`
    });
  },

  goAddTemplate() {
    wx.navigateTo({
      url: '/pages/template/add/add'
    });
  },

  editTemplate(e) {
    const template = e.currentTarget.dataset.template;
    wx.navigateTo({
      url: `/pages/template/add/add?id=${template.id}`
    });
  },

  deleteTemplate(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个模板吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.deleteTemplate(id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadTemplates();
          }).catch(err => {
            console.error('删除模板失败:', err);
          });
        }
      }
    });
  }
});