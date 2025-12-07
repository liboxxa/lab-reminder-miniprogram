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

    // 保存为模板相关
    saveAsTemplate: false,
    templateName: '',

    // 步骤编辑弹窗
    showStepModal: false,
    editingStepIndex: -1,
    editingStep: {
      name: '',
      dayType: 'day',
      dayNum: '',
      time: '09:00',
      reagentText: '',
      reagents: []
    },

    // 试剂选择弹窗
    showReagentSelector: false,
    reagentList: [],
    selectedReagentMap: {} // { [id]: {id,name,unit,amount} }
  },

  onLoad(options) {
    this.initStartDate();
    this.loadTemplates();

    if (options.templateId) {
      this.setData({
        'formData.templateId': options.templateId
      });
    }
  },

  // 初始化开始日期为今天
  initStartDate() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.setData({
      'formData.startDate': `${y}-${m}-${d}`
    });
  },

  // 加载模板列表
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

  // 表单输入
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

  // 从常用类型标签选择
  selectTypeFromTag(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type
    }, () => {
      this.filterTemplates();
    });
  },

  // 选择模板
  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      'formData.templateId': template.id,
      'formData.type': template.type || this.data.formData.type
    });

    if (template.steps && template.steps.length) {
      const steps = template.steps.map(s => ({
        name: s.name || s.content || '',
        dayType: s.dayType || s.day_type || 'day',
        dayNum: s.dayNum != null ? s.dayNum : (s.day_num || 0),
        time: s.time || s.remind_time || '09:00',
        reagentText: s.reagentText || '',
        reagents: s.reagents || []
      }));
      this.setData({ steps });
    }
  },

  // 修改开始日期
  onDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  // 步骤导航：上一步/下一步
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

  // 打开步骤编辑弹窗（新增）
  openStepModal() {
    this.setData({
      showStepModal: true,
      editingStepIndex: -1,
      editingStep: {
        name: '',
        dayType: 'day',
        dayNum: '',
        time: '09:00',
        reagentText: '',
        reagents: []
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
      editingStep: {
        name: step.name,
        dayType: step.dayType,
        dayNum: String(step.dayNum),
        time: step.time || '09:00',
        reagentText: step.reagentText || '',
        reagents: step.reagents || []
      }
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

  // 修改时间类型
  setStepDayType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'editingStep.dayType': type
    });
  },

  // 步骤弹窗里的输入
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

  // 打开试剂选择弹窗
  openReagentSelector() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    // 从当前步骤初始化 map
    const selectedReagentMap = this.buildReagentMapFromStep(this.data.editingStep);

    if (!this.data.reagentList.length) {
      api.getReagentList({ tab: 'all' }).then(res => {
        this.setData({
          reagentList: res.data || [],
          selectedReagentMap,
          showReagentSelector: true
        });
      }).catch(err => {
        console.error('获取试剂列表失败:', err);
        wx.showToast({ title: '获取试剂列表失败', icon: 'none' });
      });
    } else {
      this.setData({
        selectedReagentMap,
        showReagentSelector: true
      });
    }
  },

  buildReagentMapFromStep(step) {
    const map = {};
    if (step && Array.isArray(step.reagents)) {
      step.reagents.forEach(r => {
        if (r.id) {
          map[r.id] = {
            id: r.id,
            name: r.name,
            unit: r.unit || '',
            amount: r.amount || ''
          };
        }
      });
    }
    return map;
  },

  closeReagentSelector() {
    this.setData({ showReagentSelector: false });
  },

  // 勾选试剂变化
  onReagentCheckChange(e) {
    const checkedIds = e.detail.value;  // [id1, id2, ...]
    const { reagentList, selectedReagentMap } = this.data;
    const newMap = {};

    checkedIds.forEach(id => {
      if (selectedReagentMap[id]) {
        newMap[id] = selectedReagentMap[id];
      } else {
        const r = reagentList.find(item => item.id === id);
        if (r) {
          newMap[id] = {
            id: r.id,
            name: r.name,
            unit: r.unit || '',
            amount: ''
          };
        }
      }
    });

    this.setData({ selectedReagentMap: newMap });
  },

  // 用量输入
  onReagentAmountInput(e) {
    const id = e.currentTarget.dataset.id;
    const value = e.detail.value;
    const { reagentList } = this.data;
    const map = { ...this.data.selectedReagentMap };

    if (!map[id]) {
      const r = reagentList.find(item => item.id === id);
      if (r) {
        map[id] = {
          id: r.id,
          name: r.name,
          unit: r.unit || '',
          amount: value
        };
      }
    } else {
      map[id] = {
        ...map[id],
        amount: value
      };
    }

    this.setData({ selectedReagentMap: map });
  },

  // 确认选择试剂，把结果写回 editingStep
  confirmReagentSelection() {
    const map = this.data.selectedReagentMap || {};
    const list = Object.values(map);

    // 生成文本：名称 + 空格 + 用量+单位，用 "；" 连接
    const reagentText = list.map(r => {
      const amountPart = r.amount ? `${r.amount}${r.unit || ''}` : '';
      return amountPart ? `${r.name} ${amountPart}` : r.name;
    }).join('；');

    this.setData({
      'editingStep.reagents': list,
      'editingStep.reagentText': reagentText,
      showReagentSelector: false
    });
  },

  // 保存步骤
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

    const reagents = Array.isArray(s.reagents) ? s.reagents : [];

    // 确保 reagentText 至少从 reagents 自动生成一次
    let reagentText = s.reagentText || '';
    if (!reagentText && reagents.length) {
      reagentText = reagents.map(r => {
        const amountPart = r.amount ? `${r.amount}${r.unit || ''}` : '';
        return amountPart ? `${r.name} ${amountPart}` : r.name;
      }).join('；');
    }

    const stepData = {
      name: s.name.trim(),
      dayType: s.dayType,
      dayNum: parseInt(s.dayNum, 10),
      time: s.dayType === 'day' ? (s.time || '09:00') : '',
      reagentText,
      reagents
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

  // 保存为模板开关 & 模板名
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

  // 提交入口
  submit() {
    const { steps } = this.data;
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

  // 真正提交创建实验 + 可选保存为模板
  doSubmit() {
    const { formData, steps, saveAsTemplate, templateName } = this.data;

    wx.showLoading({ title: '创建中...' });

    // 映射到后端的 reminders
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
      strainIds: [],           // 省略选择菌种这一步
      reminders,
      isShared: formData.isShared,
      groupId: formData.groupId
    };

    console.log('📤 提交创建实验:', submitData);

    api.createExperiment(submitData).then(res => {
      // 如需保存为模板
      if (saveAsTemplate && steps.length > 0) {
        const tplName = (templateName || formData.name).trim();
        const tplData = {
          name: tplName,
          type: formData.type.trim(),
          steps: steps
        };
        api.createTemplate(tplData).catch(err => {
          console.error('保存模板失败:', err);
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