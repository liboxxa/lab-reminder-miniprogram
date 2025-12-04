const api = require('../../../utils/api');

Page({
  data: {
    currentStep: 1,
    formData: {
      name: '',
      type: '',
      templateId: '',
      startDate: '',
      description: '',
      reminders: [],
      isShared: false,
      groupId: ''
    },
    experimentTypes: ['涂布培养', '划线培养', '液体培养', '甲醇诱导', '转化实验', '其他'],
    templateList: [],
    strainList: [],
    selectedStrains: [],
    selectedStrainsInfo: [],
    groupList: [],
    selectedGroupIndex: 0,
    showReminderModal: false,
    editingReminderIndex: -1,
    newReminder: {
      dayType: 'day',
      dayNum: '',
      time: '09:00',
      content: '',
      needPhoto: false
    },
    // 订阅消息模板ID
    subscribeTemplateId: 'SYDLqB_b-hYwnS3RQ3dtfAGewfpiL6wZRNcxxJZHsDw'
  },

  onLoad(options) {
    this.loadTemplateList();
    this.loadStrainList();
    this.loadGroupList();
    
    // 设置今天为默认开始日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      'formData.startDate': `${year}-${month}-${day}`
    });

    // 如果从菌种页面跳转过来，预选该菌种
    if (options.strainId) {
      this.setData({
        selectedStrains: [options.strainId]
      });
    }
  },

  onShow() {
    // 页面显示时重新加载菌种列表（可能新增了菌种）
    this.loadStrainList();
  },

  // 加载模板列表
  loadTemplateList() {
    api.getTemplateList().then(res => {
      const data = res.data;
      const allTemplates = [
        ...(data.systemTemplates || []),
        ...(data.myTemplates || [])
      ];
      this.setData({ templateList: allTemplates });
    }).catch(err => {
      console.error('获取模板列表失败:', err);
    });
  },

  // 加载菌种列表
  loadStrainList() {
    api.getStrainList().then(res => {
      this.setData({ strainList: res.data || [] });
      this.updateSelectedStrainsInfo();
    }).catch(err => {
      console.error('获取菌种列表失败:', err);
    });
  },

  // 加载团队列表
  loadGroupList() {
    api.getGroupList().then(res => {
      this.setData({ groupList: res.data || [] });
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

  // 选择实验类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type
    });
  },

  // 选择模板
  selectTemplate(e) {
    const template = e.currentTarget.dataset.template;
    this.setData({
      'formData.templateId': template.id,
      'formData.type': template.type,
      'formData.reminders': JSON.parse(JSON.stringify(template.steps))
    });
  },

  // 日期变更
  onDateChange(e) {
    this.setData({
      'formData.startDate': e.detail.value
    });
  },

  // 切换菌种选择
  toggleStrain(e) {
    const id = e.currentTarget.dataset.id;
    let selectedStrains = [...this.data.selectedStrains];
    
    const index = selectedStrains.indexOf(id);
    if (index > -1) {
      selectedStrains.splice(index, 1);
    } else {
      selectedStrains.push(id);
    }
    
    this.setData({ selectedStrains });
    this.updateSelectedStrainsInfo();
  },

  // 移除已选菌种
  removeStrain(e) {
    const id = e.currentTarget.dataset.id;
    let selectedStrains = [...this.data.selectedStrains];
    const index = selectedStrains.indexOf(id);
    if (index > -1) {
      selectedStrains.splice(index, 1);
    }
    this.setData({ selectedStrains });
    this.updateSelectedStrainsInfo();
  },

  // 更新已选菌种信息
  updateSelectedStrainsInfo() {
    const selectedStrainsInfo = this.data.strainList.filter(
      s => this.data.selectedStrains.includes(s.id)
    );
    this.setData({ selectedStrainsInfo });
  },

  // 打开提醒弹窗
  addReminder() {
    this.setData({
      showReminderModal: true,
      editingReminderIndex: -1,
      newReminder: {
        dayType: 'day',
        dayNum: '',
        time: '09:00',
        content: '',
        needPhoto: false
      }
    });
  },

  // 编辑提醒
  editReminder(e) {
    const index = e.currentTarget.dataset.index;
    const reminder = this.data.formData.reminders[index];
    this.setData({
      showReminderModal: true,
      editingReminderIndex: index,
      newReminder: JSON.parse(JSON.stringify(reminder))
    });
  },

  // 删除提醒
  deleteReminder(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条提醒吗？',
      success: (res) => {
        if (res.confirm) {
          const reminders = [...this.data.formData.reminders];
          reminders.splice(index, 1);
          this.setData({
            'formData.reminders': reminders
          });
        }
      }
    });
  },

  // 关闭提醒弹窗
  closeReminderModal() {
    this.setData({ showReminderModal: false });
  },

  // 设置时间类型
  setDayType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'newReminder.dayType': type
    });
  },

  // 提醒输入处理
  onReminderInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newReminder.${field}`]: e.detail.value
    });
  },

  // 提醒时间变更
  onReminderTimeChange(e) {
    this.setData({
      'newReminder.time': e.detail.value
    });
  },

  // 是否需要拍照
  onNeedPhotoChange(e) {
    this.setData({
      'newReminder.needPhoto': e.detail.value
    });
  },

  // 保存提醒
  saveReminder() {
    const { newReminder, editingReminderIndex, formData } = this.data;

    if (newReminder.dayNum === '' && newReminder.dayNum !== 0) {
      wx.showToast({ title: '请输入时间', icon: 'none' });
      return;
    }
    if (!newReminder.content.trim()) {
      wx.showToast({ title: '请输入提醒内容', icon: 'none' });
      return;
    }

    const reminderData = {
      dayType: newReminder.dayType,
      dayNum: parseInt(newReminder.dayNum),
      time: newReminder.time,
      content: newReminder.content,
      needPhoto: newReminder.needPhoto
    };

    const reminders = [...formData.reminders];

    if (editingReminderIndex >= 0) {
      reminders[editingReminderIndex] = reminderData;
    } else {
      reminders.push(reminderData);
    }

    // 按时间排序
    reminders.sort((a, b) => {
      if (a.dayType !== b.dayType) {
        return a.dayType === 'hour' ? -1 : 1;
      }
      return a.dayNum - b.dayNum;
    });

    this.setData({
      'formData.reminders': reminders,
      showReminderModal: false
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

  // 上一步
  prevStep() {
    this.setData({
      currentStep: this.data.currentStep - 1
    });
  },

  // 下一步
  nextStep() {
    const { currentStep, formData, selectedStrains } = this.data;

    // 验证步骤1
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        wx.showToast({ title: '请输入实验名称', icon: 'none' });
        return;
      }
      if (!formData.type) {
        wx.showToast({ title: '请选择实验类型', icon: 'none' });
        return;
      }
      if (!formData.startDate) {
        wx.showToast({ title: '请选择开始日期', icon: 'none' });
        return;
      }
    }

    // 步骤2可以不选菌种
    if (currentStep === 2 && selectedStrains.length === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有选择菌种，确定继续吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({ currentStep: currentStep + 1 });
          }
        }
      });
      return;
    }

    this.setData({
      currentStep: currentStep + 1
    });
  },

  // 提交创建实验
  submit() {
    const { formData } = this.data;

    if (formData.reminders.length === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有设置提醒计划，确定创建吗？',
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

  // 执行提交
  doSubmit() {
    const { formData, selectedStrains, subscribeTemplateId } = this.data;
    const reminderCount = formData.reminders.length;

    console.log('📤 开始创建实验流程');

    // 如果有提醒，先请求订阅授权
    if (reminderCount > 0 && subscribeTemplateId) {
      // 一次最多订阅3条
      const count = Math.min(reminderCount, 3);
      const tmplIds = [];
      for (let i = 0; i < count; i++) {
        tmplIds.push(subscribeTemplateId);
      }

      console.log('📢 请求订阅消息授权, 数量:', count);

      wx.requestSubscribeMessage({
        tmplIds: tmplIds,
        success: (res) => {
          console.log('✅ 订阅授权结果:', res);
        },
        fail: (err) => {
          console.log('❌ 订阅授权失败或拒绝:', err);
        },
        complete: () => {
          // 无论授权成功还是失败，都继续创建实验
          this.createExperiment();
        }
      });
    } else {
      // 没有提醒或没有模板ID，直接创建
      this.createExperiment();
    }
  },

  // 实际创建实验
  createExperiment() {
    const { formData, selectedStrains } = this.data;

    wx.showLoading({ title: '创建中...' });

    const submitData = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      templateId: formData.templateId,
      startDate: formData.startDate,
      strainIds: selectedStrains,
      reminders: formData.reminders,
      isShared: formData.isShared,
      groupId: formData.groupId
    };

    console.log('📤 提交创建实验:', submitData);

    api.createExperiment(submitData).then(res => {
      wx.hideLoading();
      console.log('✅ 创建实验成功:', res);
      
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      console.error('❌ 创建实验失败:', err);
    });
  },

  // 跳转添加菌种
  goAddStrain() {
    wx.navigateTo({
      url: '/pages/strain/add/add'
    });
  },

  // 跳转添加模板
  goAddTemplate() {
    wx.navigateTo({
      url: '/pages/template/add/add'
    });
  }
});