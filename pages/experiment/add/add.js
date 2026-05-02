const api = require('../../../utils/api');
const app = getApp();
const SUBSCRIBE_TEMPLATE_ID = 'SYDLqB_b-hYwnS3RQ3dtfAGewfpiL6wZRNcxxJZHsDw';
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
    // 团队共享相关
    groupList: [],
    selectedGroupIndex: 0,
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
    selectedReagentMap: {}, // { [id]: {id,name,unit,amount,stockAmount} }

    // 试剂库
    libraryList: [],
    libraryNameList: [],
    libraryIndex: 0,
    currentLibraryId: null,
    currentLibraryName: '',
    stepLibraryIndex: 0
  },

  reagentCache: {},

  onLoad(options) {
    this.initStartDate();
    this.loadTemplates();
    this.loadLibraries();
    this.loadGroupList();   // 新增：加载我的团队列表
    if (options.templateId) {
      this.setData({
        'formData.templateId': options.templateId
      });
    }
  },

  loadLibraries() {
    if (!app.globalData.isLogin) return;
    api.getReagentLibraryList().then(res => {
      const list = res.data || [];
      const nameList = list.map(item => item.name || '未命名');
      let index = 0;
      const cachedId = wx.getStorageSync('currentLibraryId');
      if (cachedId) {
        const found = list.findIndex(l => l.id == cachedId);
        if (found !== -1) index = found;
      }
      const current = list[index] || {};
      this.setData({
        libraryList: list.map(item => ({ id: item.id, name: item.name })),
        libraryNameList: nameList,
        libraryIndex: index,
        currentLibraryId: current.id || null,
        currentLibraryName: current.name || '',
        stepLibraryIndex: index
      });
    }).catch(err => {
      console.error('获取试剂库列表失败:', err);
    });
  },
  loadGroupList() {
    if (!app.globalData.isLogin) return;
    api.getGroupList().then(res => {
      const list = res.data || [];
      this.setData({ groupList: list });
  
      // 如果当前已经勾选共享，且有团队，则默认选第一个
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
  onShareChange(e) {
    const checked = e.detail.value;
    this.setData({
      'formData.isShared': checked
    });
  
    if (checked && this.data.groupList.length > 0) {
      // 默认选择第一个团队
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
    const { libraryIndex, currentLibraryId, currentLibraryName } = this.data;
    this.setData({
      showStepModal: true,
      editingStepIndex: -1,
      editingStep: {
        name: '',
        dayType: 'day',
        dayNum: '',
        time: '09:00',
        reagentText: '',
        reagents: [],
        reagentLibraryId: currentLibraryId,
        reagentLibraryName: currentLibraryName
      },
      stepLibraryIndex: libraryIndex
    });
  },

  // 编辑已有步骤
  editStep(e) {
    const index = e.currentTarget.dataset.index;
    const step = this.data.steps[index];
    const list = this.data.libraryList || [];
    const stepLibId = step.reagentLibraryId || this.data.currentLibraryId;
    const libIndex = stepLibId ? list.findIndex(l => l.id == stepLibId) : this.data.libraryIndex;
    this.setData({
      showStepModal: true,
      editingStepIndex: index,
      editingStep: {
        name: step.name,
        dayType: step.dayType,
        dayNum: String(step.dayNum),
        time: step.time || '09:00',
        reagentText: step.reagentText || '',
        reagents: step.reagents || [],
        reagentLibraryId: step.reagentLibraryId || this.data.currentLibraryId,
        reagentLibraryName: step.reagentLibraryName || this.data.currentLibraryName
      },
      stepLibraryIndex: libIndex >= 0 ? libIndex : this.data.libraryIndex
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

  onStepLibraryChange(e) {
    const index = parseInt(e.detail.value, 10);
    const lib = (this.data.libraryList || [])[index] || {};
    this.setData({
      stepLibraryIndex: index,
      'editingStep.reagentLibraryId': lib.id || null,
      'editingStep.reagentLibraryName': lib.name || '',
      reagentList: [],
      selectedReagentMap: {}
    });
  },

  loadReagentsByLibrary(libraryId) {
    if (!libraryId) return Promise.resolve([]);
    if (this.reagentCache[libraryId]) {
      return Promise.resolve(this.reagentCache[libraryId]);
    }
    return api.getReagentList({ libraryId }).then(res => {
      const list = res.data || [];
      this.reagentCache[libraryId] = list;
      return list;
    });
  },

  // 打开试剂选择弹窗
  openReagentSelector() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    const libraryId = this.data.editingStep.reagentLibraryId || this.data.currentLibraryId;
    if (!libraryId) {
      wx.showToast({ title: '请先选择试剂库', icon: 'none' });
      return;
    }

    // 从当前步骤初始化 map
    const selectedReagentMap = this.buildReagentMapFromStep(this.data.editingStep);

    this.loadReagentsByLibrary(libraryId).then(list => {
      this.setData({
        reagentList: list,
        selectedReagentMap,
        showReagentSelector: true
      });
    }).catch(err => {
      console.error('获取试剂列表失败:', err);
      wx.showToast({ title: '获取试剂列表失败', icon: 'none' });
    });
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
            amount: '',
            stockAmount: r.stockAmount
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
          amount: value,
          stockAmount: r.stockAmount
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
      'editingStep.reagentLibraryId': this.data.editingStep.reagentLibraryId || this.data.currentLibraryId,
      'editingStep.reagentLibraryName': this.data.editingStep.reagentLibraryName || this.data.currentLibraryName,
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
      reagents,
      reagentLibraryId: s.reagentLibraryId || this.data.currentLibraryId,
      reagentLibraryName: s.reagentLibraryName || this.data.currentLibraryName
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
            if (this.validateReagentInputs()) {
              this.subscribeAndSubmit();
            }
          }
        }
      });
    } else {
      if (this.validateReagentInputs()) {
        this.subscribeAndSubmit();
      }
    }
  },

  // 先请求订阅授权，再真正提交创建实验
  subscribeAndSubmit() {
    // 如果没配置模板 ID，就直接走提交，避免报错
    if (!SUBSCRIBE_TEMPLATE_ID) {
      this.doSubmit();
      return;
    }

    wx.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TEMPLATE_ID],
      success: (res) => {
        // 打印授权结果，看用户是 accept / reject / ban
        console.log('订阅消息授权结果:', res);
        // 无论同意还是拒绝，都继续创建实验（只是后端能不能推送的问题）
        this.doSubmit();
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err);
        // 授权失败也继续创建实验，避免阻塞正常流程
        this.doSubmit();
      }
    });
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
      groupId: formData.groupId,
      reagentUsages: this.buildReagentUsages()
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
      if (err && err.message) {
        wx.showToast({ title: err.message, icon: 'none' });
      }
    });
  },

  validateReagentInputs() {
    const steps = this.data.steps || [];
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      if (Array.isArray(step.reagents) && step.reagents.length > 0) {
        for (let j = 0; j < step.reagents.length; j += 1) {
          const r = step.reagents[j];
          if (!r.name || !String(r.name).trim()) {
            wx.showToast({ title: '请填写试剂名称', icon: 'none' });
            return false;
          }
          if (!r.amount || !String(r.amount).trim() || !r.unit || !String(r.unit).trim()) {
            wx.showToast({ title: '请填写试剂用量（含单位）', icon: 'none' });
            return false;
          }
        }
      }

      if (step.reagentText) {
        const items = this.parseReagentText(step.reagentText);
        for (let k = 0; k < items.length; k += 1) {
          const item = items[k];
          if (!item.name) {
            wx.showToast({ title: '请填写试剂名称', icon: 'none' });
            return false;
          }
          if (!item.amount || !item.unit) {
            wx.showToast({ title: '请填写试剂用量（含单位）', icon: 'none' });
            return false;
          }
        }
      }
    }

    return true;
  },

  buildReagentUsages() {
    const usages = [];
    const steps = this.data.steps || [];
    
    steps.forEach((step, index) => {
      const libraryId = step.reagentLibraryId 
        || this.data.currentLibraryId 
        || wx.getStorageSync('currentLibraryId');
  
      // ✅ 优先用 reagents（从选择器选的，有 reagentId）
      if (Array.isArray(step.reagents) && step.reagents.length > 0) {
        step.reagents.forEach(r => {
          usages.push({
            libraryId: libraryId || null,
            reagentId: r.id,
            reagentName: r.name,
            unit: r.unit || '',
            amount: r.amount || '',
            stepIndex: index,
            stepName: step.name,
            source: 'picker'
          });
        });
        // ✅ 有 reagents 就不再处理 reagentText，避免重复
        return;
      }
  
      // ✅ 没有 reagents 时才解析 reagentText
      if (step.reagentText) {
        const items = this.parseReagentText(step.reagentText);
        items.forEach(item => {
          if (!item.name) return;
          usages.push({
            libraryId: libraryId || null,
            reagentName: item.name,
            unit: item.unit || '',
            amount: item.amount || '',
            stepIndex: index,
            stepName: step.name,
            source: 'text'
          });
        });
      }
    });
  
    console.log('📦 buildReagentUsages 结果:', JSON.stringify(usages, null, 2));
    return usages;
  },

  parseReagentText(text) {
    const items = [];
    const parts = text.split(/[；;\n]/).map(t => t.trim()).filter(Boolean);
    parts.forEach(part => {
      const match = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z\u4e00-\u9fa5]+)?$/);
      if (match) {
        items.push({
          name: match[1].trim(),
          amount: match[2],
          unit: match[3] || ''
        });
      } else {
        items.push({ name: part.trim(), amount: '', unit: '' });
      }
    });
    return items;
  }
});