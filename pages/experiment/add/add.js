const api = require('../../../utils/api');
const app = getApp();

Page({
  data: {
    currentStep: 1,
    formData: {
      name: '',
      type: '',
      templateId: '',
      startDate: '',
      description: '',
      isShared: false,
      groupId: ''
    },
    templateList: [],
    filteredTemplates: [],
    typeOptions: [],
    steps: [],

    // 新增：
    saveAsTemplate: false,
    templateName: '',

    showStepModal: false,
    editingStepIndex: -1,
    editingStep: {
      name: '',
      dayType: 'day',
      dayNum: '',
      time: '09:00',
      reagentText: ''
    }
  },

  onLoad(options) {
    this.initStartDate();
    this.loadTemplates();

    // 若从模板详情跳转带了 templateId，可预选模板
    if (options.templateId) {
      this.setData({
        'formData.templateId': options.templateId
      });
    }
  },

  onShow() {
    // 模板变化时可以重新加载，这里暂不自动重新加载以减少请求
  },

  initStartDate() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.setData({
      'formData.startDate': `${y}-${m}-${d}`
    });
  },

  loadTemplates() {
    if (!app.globalData.isLogin) return;

    api.getTemplateList().then(res => {
      const myTemplates = res.data.myTemplates || [];
      const typeSet = new Set();
      myTemplates.forEach(t => {
        if (t.type) typeSet.add(t.type);
      });
      this.setData({
        templateList: myTemplates,
        typeOptions: Array.from(typeSet)
      });
      this.filterTemplates();
    }).catch(err => {
      console.error('获取模板列表失败:', err);
    });
  },
  onSaveAsTemplateChange(e) {
  this.setData({
    saveAsTemplate: e.detail.value
  });
},

onTemplateNameInput(e) {
  this.setData({
    templateName: e.detail.value
  });
},
  // 根据当前类型过滤模板
  filterTemplates() {
    const { templateList, formData } = this.data;
    let filtered = templateList;
    if (formData.type) {
      filtered = templateList.filter(t => t.type === formData.type);
    }
    this.setData({
      filteredTemplates: filtered
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    }, () => {
      if (field === 'type') {
        this.filterTemplates();
      }
    });
  },

  selectTypeFromTag(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type
    }, () => {
      this.filterTemplates();
    });
  },

  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      'formData.templateId': template.id,
      'formData.type': template.type || this.data.formData.type
    });
    // 若模板自带步骤，可以直接用模板步骤初始化
    if (template.steps && template.steps.length) {
      // 深拷贝，并兼容字段
      const steps = template.steps.map(s => ({
        name: s.name || s.content || '',
        dayType: s.dayType || s.day_type || 'day',
        dayNum: s.dayNum != null ? s.dayNum : s.day_num || 0,
        time: s.time || s.remind_time || '09:00',
        reagentText: s.reagentText || ''
      }));
      this.setData({ steps });
    }
  },

  onDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  // 步骤导航
  prevStep() {
    this.setData({
      currentStep: this.data.currentStep - 1
    });
  },

  nextStep() {
    const { currentStep, formData } = this.data;
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        wx.showToast({ title: '请输入实验名称', icon: 'none' });
        return;
      }
      if (!formData.type.trim()) {
        wx.showToast({ title: '请输入实验类型', icon: 'none' });
        return;
      }
      if (!formData.startDate) {
        wx.showToast({ title: '请选择开始日期', icon: 'none' });
        return;
      }
    }
    this.setData({
      currentStep: currentStep + 1
    });
  },

  // 打开步骤编辑弹窗：新增
  openStepModal() {
    this.setData({
      showStepModal: true,
      editingStepIndex: -1,
      editingStep: {
        name: '',
        dayType: 'day',
        dayNum: '',
        time: '09:00',
        reagentText: ''
      }
    });
  },

  // 编辑已有步骤
  editStep(e) {
    const index = e.currentTarget.dataset.index;
    const step = this.data.steps[index];
    this.setData({
      showStepModal: true,
      editingStepIndex: index,
      editingStep: { ...step }
    });
  },

  // 删除步骤
  deleteStep(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这一步骤吗？',
      success: (res) => {
        if (res.confirm) {
          const steps = this.data.steps.slice();
          steps.splice(index, 1);
          this.setData({ steps });
        }
      }
    });
  },

  closeStepModal() {
    this.setData({ showStepModal: false });
  },

  setStepDayType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'editingStep.dayType': type
    });
  },

  onStepInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`editingStep.${field}`]: e.detail.value
    });
  },

  onStepTimeChange(e) {
    this.setData({
      'editingStep.time': e.detail.value
    });
  },

  saveStep() {
    const s = this.data.editingStep;
    if (!s.name.trim()) {
      wx.showToast({ title: '请输入步骤名称', icon: 'none' });
      return;
    }
    if (s.dayNum === '' || isNaN(Number(s.dayNum))) {
      wx.showToast({ title: '请输入时间（第几天/小时）', icon: 'none' });
      return;
    }

    const stepData = {
      name: s.name.trim(),
      dayType: s.dayType,
      dayNum: parseInt(s.dayNum),
      time: s.dayType === 'day' ? (s.time || '09:00') : '',
      reagentText: s.reagentText || ''
    };

    const steps = this.data.steps.slice();
    if (this.data.editingStepIndex >= 0) {
      steps[this.data.editingStepIndex] = stepData;
    } else {
      steps.push(stepData);
    }

    // 按时间排序：小时优先，其次按 dayNum
    steps.sort((a, b) => {
      if (a.dayType !== b.dayType) {
        return a.dayType === 'hour' ? -1 : 1;
      }
      return a.dayNum - b.dayNum;
    });

    this.setData({
      steps,
      showStepModal: false
    });
  },

  // 最终提交：将实验步骤映射到后端的 reminders
  submit() {
    const { formData, steps } = this.data;

    if (!steps.length) {
      wx.showModal({
        title: '提示',
        content: '还没有添加任何实验步骤，确定要继续吗？',
        success: (res) => {
          if (res.confirm) {
            this.doSubmit();
          }
        }
      });
      return;
    }

    this.doSubmit();
  },

  doSubmit() {
    const { formData, steps, saveAsTemplate, templateName } = this.data;
  
    wx.showLoading({ title: '创建中...' });
  
    const reminders = steps.map(step => {
      const baseContent = step.name;
      const reagentPart = step.reagentText ? `；试剂：${step.reagentText}` : '';
      return {
        dayType: step.dayType,
        dayNum: step.dayNum,
        time: step.time || '09:00',
        content: baseContent + reagentPart,
        needPhoto: false
      };
    });
  
    const submitData = {
      name: formData.name.trim(),
      type: formData.type.trim(),
      description: formData.description,
      templateId: formData.templateId || null,
      startDate: formData.startDate,
      strainIds: [],
      reminders: reminders,
      isShared: formData.isShared,
      groupId: formData.groupId
    };
  
    console.log('📤 提交创建实验:', submitData);
  
    api.createExperiment(submitData).then(res => {
      // 实验创建成功后，如果需要保存模板
      if (saveAsTemplate && steps.length > 0) {
        const tplName = (templateName || formData.name).trim();
        const tplData = {
          name: tplName,
          type: formData.type.trim(),
          steps: steps    // 直接用当前 steps 数组（包含 name/dayType/dayNum/time/reagentText）
        };
        api.createTemplate(tplData).catch(err => {
          console.error('保存模板失败:', err);
          // 这里失败不影响实验已创建成功，所以只打日志，不提示报错
        });
      }
  
      wx.hideLoading();
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('创建实验失败:', err);
    });
  }
});