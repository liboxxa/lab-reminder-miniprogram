const api = require('../../../utils/api');

Page({
  data: {
    formData: {
      name: '',
      description: '',
      unit: '',
      stockAmount: '',
      isShared: false,
      groupId: ''
    },
    isEdit: false,
    editId: '',
    groupList: [],
    selectedGroupIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑试剂' });
      this.loadDetail(options.id);
    }
    this.loadGroupList();   // 新增
  },

  loadDetail(id) {
    api.getReagentDetail(id).then(res => {
      const r = res.data;
      this.setData({
        formData: {
          name: r.name || '',
          description: r.description || '',
          unit: r.unit || '',
          stockAmount: r.stockAmount || '',
          isShared: r.isShared || false,
          groupId: r.groupId || ''
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

  onShareChange(e) {
    this.setData({
      'formData.isShared': e.detail.value
    });
  },
  loadGroupList() {
    const api = require('../../../utils/api');
    api.getGroupList().then(res => {
      const list = res.data || [];
      this.setData({ groupList: list });
  
      if (this.data.formData.isShared && list.length > 0) {
        this.setData({
          selectedGroupIndex: 0,
          'formData.groupId': list[0].id
        });
      }
    }).catch(err => {
      console.error('获取团队列表失败:', err);
    });
  },
  
  onShareChange(e) {
    const checked = e.detail.value;
    this.setData({
      'formData.isShared': checked
    });
  
    if (checked && this.data.groupList.length > 0) {
      this.setData({
        selectedGroupIndex: 0,
        'formData.groupId': this.data.groupList[0].id
      });
    } else {
      this.setData({
        'formData.groupId': ''
      });
    }
  },
  
  onGroupChange(e) {
    const index = parseInt(e.detail.value, 10);
    const group = this.data.groupList[index];
    this.setData({
      selectedGroupIndex: index,
      'formData.groupId': group ? group.id : ''
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
      isShared: formData.isShared,
      groupId: formData.groupId
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