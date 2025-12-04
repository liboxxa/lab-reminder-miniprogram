const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    systemTemplates: [],
    myTemplates: [],
    showDetailModal: false,
    currentTemplate: null
  },

  onLoad() {
  },

  onShow() {
    this.loadTemplates();
  },

  // 加载模板
  loadTemplates() {
    if (!app.globalData.isLogin) {
      return;
    }

    api.getTemplateList().then(res => {
      const data = res.data;
      this.setData({
        systemTemplates: data.systemTemplates || [],
        myTemplates: data.myTemplates || []
      });
    }).catch(err => {
      console.error('获取模板列表失败:', err);
    });
  },

  // 查看模板详情
  viewTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      showDetailModal: true,
      currentTemplate: template
    });
  },

  // 关闭详情弹窗
  closeDetailModal() {
    this.setData({
      showDetailModal: false,
      currentTemplate: null
    });
  },

  // 使用模板创建实验
  useTemplate() {
    const template = this.data.currentTemplate;
    this.closeDetailModal();
    wx.navigateTo({
      url: `/pages/experiment/add/add?templateId=${template.id}`
    });
  },

  // 新建模板
  goAddTemplate() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/template/add/add'
    });
  },

  // 编辑模板
  editTemplate(e) {
    const template = e.currentTarget.dataset.template;
    wx.navigateTo({
      url: `/pages/template/add/add?id=${template.id}`
    });
  },

  // 删除模板
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
            console.error('删除失败:', err);
          });
        }
      }
    });
  }
});