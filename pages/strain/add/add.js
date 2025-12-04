const api = require('../../../utils/api');

Page({
  data: {
    formData: {
      name: '',
      description: '',
      source: '',
      storageLocation: '',
      conditions: {
        temperature: '',
        medium: '',
        other: ''
      },
      isShared: false,
      groupId: ''
    },
    groupList: [],
    selectedGroupIndex: 0,
    isEdit: false,
    editId: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑菌种' });
      this.loadStrainDetail(options.id);
    }
    this.loadGroupList();
  },

  // 加载菌种详情（编辑模式）
  loadStrainDetail(id) {
    api.getStrainDetail(id).then(res => {
      const strain = res.data;
      this.setData({
        formData: {
          name: strain.name || '',
          description: strain.description || '',
          source: strain.source || '',
          storageLocation: strain.storageLocation || '',
          conditions: strain.conditions || { temperature: '', medium: '', other: '' },
          isShared: strain.isShared || false,
          groupId: strain.groupId || ''
        }
      });
    }).catch(err => {
      console.error('获取菌种详情失败:', err);
    });
  },

  // 加载团队列表
  loadGroupList() {
    api.getGroupList().then(res => {
      this.setData({
        groupList: res.data || []
      });
    }).catch(err => {
      console.error('获取团队列表失败:', err);
    });
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 培养条件输入
  onConditionInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.conditions.${field}`]: e.detail.value
    });
  },

  // 共享开关
  onShareChange(e) {
    this.setData({
      'formData.isShared': e.detail.value
    });
  },

  // 选择团队
  onGroupChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedGroupIndex: index,
      'formData.groupId': this.data.groupList[index]?.id || ''
    });
  },

  // 提交
  submit() {
    const { formData, isEdit, editId } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入菌种名称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const submitData = {
      name: formData.name,
      description: formData.description,
      source: formData.source,
      storageLocation: formData.storageLocation,
      conditions: formData.conditions,
      isShared: formData.isShared,
      groupId: formData.groupId
    };

    const request = isEdit 
      ? api.updateStrain(editId, submitData)
      : api.createStrain(submitData);

    request.then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('保存失败:', err);
    });
  }
});