const api = require('../../../utils/api');

Page({
  data: {
    isEdit: false,
    editId: '',
    formData: {
      name: '',
      type: '',
      steps: []
    },
    experimentTypes: ['涂布培养', '划线培养', '液体培养', '甲醇诱导', '转化实验', '其他'],
    showStepModal: false,
    editingStepIndex: -1,
    newStep: {
      dayType: 'day',
      dayNum: '',
      time: '09:00',
      content: '',
      needPhoto: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑模板' });
      this.loadTemplate(options.id);
    }
  },

  // 加载模板（编辑模式）
  loadTemplate(id) {
    api.getTemplateDetail(id).then(res => {
      const template = res.data;
      this.setData({
        formData: {
          name: template.name || '',
          type: template.type || '',
          steps: template.steps || []
        }
      });
    }).catch(err => {
      console.error('获取模板详情失败:', err);
    });
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 选择实验类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type
    });
  },

  // 添加步骤
  addStep() {
    this.setData({
      showStepModal: true,
      editingStepIndex: -1,
      newStep: {
        dayType: 'day',
        dayNum: '',
        time: '09:00',
        content: '',
        needPhoto: false
      }
    });
  },

  // 编辑步骤
  editStep(e) {
    const index = e.currentTarget.dataset.index;
    const step = this.data.formData.steps[index];
    this.setData({
      showStepModal: true,
      editingStepIndex: index,
      newStep: { ...step, dayNum: String(step.dayNum) }
    });
  },

  // 删除步骤
  deleteStep(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个步骤吗？',
      success: (res) => {
        if (res.confirm) {
          const steps = this.data.formData.steps;
          steps.splice(index, 1);
          this.setData({ 'formData.steps': steps });
        }
      }
    });
  },

  // 关闭步骤弹窗
  closeStepModal() {
    this.setData({ showStepModal: false });
  },

  // 设置时间类型
  setDayType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'newStep.dayType': type });
  },

  // 步骤输入
  onStepInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newStep.${field}`]: e.detail.value
    });
  },

  // 时间变更
  onTimeChange(e) {
    this.setData({
      'newStep.time': e.detail.value
    });
  },

  // 是否需要拍照
  onNeedPhotoChange(e) {
    this.setData({
      'newStep.needPhoto': e.detail.value
    });
  },

  // 保存步骤
  saveStep() {
    const { newStep, editingStepIndex, formData } = this.data;

    if (!newStep.dayNum && newStep.dayNum !== '0') {
      wx.showToast({ title: '请输入时间', icon: 'none' });
      return;
    }
    if (!newStep.content.trim()) {
      wx.showToast({ title: '请输入步骤内容', icon: 'none' });
      return;
    }

    const stepData = {
      dayType: newStep.dayType,
      dayNum: parseInt(newStep.dayNum),
      time: newStep.dayType === 'day' ? newStep.time : '',
      content: newStep.content,
      needPhoto: newStep.needPhoto
    };

    const steps = formData.steps;

    if (editingStepIndex >= 0) {
      steps[editingStepIndex] = stepData;
    } else {
      steps.push(stepData);
    }

    // 按时间排序
    steps.sort((a, b) => {
      if (a.dayType !== b.dayType) {
        return a.dayType === 'hour' ? -1 : 1;
      }
      return a.dayNum - b.dayNum;
    });

    this.setData({
      'formData.steps': steps,
      showStepModal: false
    });
  },

  // 提交保存
  submit() {
    const { formData, isEdit, editId } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入模板名称', icon: 'none' });
      return;
    }
    if (!formData.type) {
      wx.showToast({ title: '请选择实验类型', icon: 'none' });
      return;
    }
    if (formData.steps.length === 0) {
      wx.showToast({ title: '请至少添加一个步骤', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const request = isEdit 
      ? api.updateTemplate(editId, formData)
      : api.createTemplate(formData);

    request.then(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('保存失败:', err);
    });
  }
});