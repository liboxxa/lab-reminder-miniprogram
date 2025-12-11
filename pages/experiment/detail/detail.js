const api = require('../../../utils/api');

Page({
  data: {
    experimentId: '',
    experimentInfo: {
      name: '',
      type: '',
      status: 'ongoing',
      startDate: '',
      currentDay: 0,
      totalReminders: 0,
      completedCount: 0,
      strainNames: '',
      description: ''
    },
    timelineList: [],
    relatedStrains: [],
    showLogModal: false,
    reminderOptions: [],
    selectedReminderIndex: 0,
    newLog: {
      content: '',
      images: []
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ experimentId: options.id });
    }
  },

  onShow() {
    if (this.data.experimentId) {
      this.loadExperimentDetail(this.data.experimentId);
    }
  },

  // 加载实验详情
  loadExperimentDetail(id) {
    api.getExperimentDetail(id).then(res => {
      console.log('📋 实验详情原始数据:', res.data);  // 添加这行
    console.log('📋 实验状态:', res.data.status);   // 添加这行
      const data = res.data;
      
      // 构建提醒选项
      const reminderOptions = data.timelineList.map((item, index) => ({
        index: index,
        taskId: item.id,
        label: `${item.dayType === 'day' ? '第' + item.dayNum + '天' : '第' + item.dayNum + '小时'} - ${item.content}`
      }));

      this.setData({
        experimentInfo: data,
        timelineList: data.timelineList || [],
        relatedStrains: data.strains || [],
        reminderOptions
      });

      wx.setNavigationBarTitle({ title: data.name });
    }).catch(err => {
      console.error('获取实验详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  // 完成任务
  completeTask(e) {
    const item = e.currentTarget.dataset.item;
    
    if (item.needPhoto) {
      wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          const images = res.tempFiles.map(f => f.tempFilePath);
          this.doCompleteTask(item, images);
        }
      });
    } else {
      this.doCompleteTask(item, []);
    }
  },

  // 执行完成任务
  doCompleteTask(item, localImages) {
    wx.showLoading({ title: '处理中...' });

    // 1. 上传图片
    const uploadPromises = localImages.map(img => {
      return api.uploadFile(img).then(res => {
        let url = res.url;
        if (url.startsWith('/')) {
           url = 'https://aixlab.online' + url;
        }
        return url;
      });
    });

    Promise.all(uploadPromises).then(uploadedUrls => {
      // 2. 调用完成接口
      api.updateReminderStatus(this.data.experimentId, item.id, {
        status: 'done',
        content: '完成任务',
        images: uploadedUrls
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '已完成', icon: 'success' });
        this.loadExperimentDetail(this.data.experimentId);
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('上传失败:', err);
    });
  },

  // 跳过任务
  skipTask(e) {
    const item = e.currentTarget.dataset.item;
    
    wx.showModal({
      title: '确认跳过',
      content: '确定要跳过这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          api.updateReminderStatus(this.data.experimentId, item.id, {
            status: 'skipped'
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已跳过', icon: 'success' });
            this.loadExperimentDetail(this.data.experimentId);
          }).catch(err => {
            wx.hideLoading();
            console.error('跳过任务失败:', err);
          });
        }
      }
    });
  },

  // 打开添加记录弹窗
  addLog() {
    this.setData({
      showLogModal: true,
      selectedReminderIndex: 0,
      newLog: { content: '', images: [] }
    });
  },

  // 关闭弹窗
  closeLogModal() {
    this.setData({ showLogModal: false });
  },

  // 选择时间点
  onReminderSelect(e) {
    this.setData({
      selectedReminderIndex: parseInt(e.detail.value)
    });
  },

  // 输入日志内容
  onLogInput(e) {
    this.setData({
      'newLog.content': e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.newLog.images.length,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          'newLog.images': [...this.data.newLog.images, ...newImages]
        });
      }
    });
  },

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.newLog.images;
    images.splice(index, 1);
    this.setData({ 'newLog.images': images });
  },

  // 提交日志
    // 提交日志
    submitLog() {
      const { newLog, reminderOptions, selectedReminderIndex, experimentId } = this.data;
  
      // 校验
      if (!newLog.content.trim() && newLog.images.length === 0) {
        wx.showToast({ title: '请输入内容或添加图片', icon: 'none' });
        return;
      }
  
      const reminderId = reminderOptions[selectedReminderIndex]?.taskId;
  
      wx.showLoading({ title: '正在上传...' });
  
      // 1. 过滤出需要上传的图片（如果是 wxfile:// 或 http://tmp 开头）
      const uploadPromises = newLog.images.map(img => {
        if (img.startsWith('wxfile://') || img.startsWith('http://tmp') || img.startsWith('wx-file://')) {
          return api.uploadFile(img).then(res => {
            // 确保拿到的是完整 URL
            let url = res.url;
            if (url.startsWith('/')) {
               url = 'https://aixlab.online' + url;
            }
            return url;
          });
        }
        return Promise.resolve(img); // 已经是网络图片的不用传
      });
  
      // 2. 等所有图片上传完
      Promise.all(uploadPromises).then(uploadedUrls => {
        // 3. 提交日志到后端
        api.addExperimentLog(experimentId, {
          reminderId: reminderId,
          content: newLog.content,
          images: uploadedUrls // 这里的 URL 都是 https://...
        }).then(() => {
          wx.hideLoading();
          wx.showToast({ title: '记录已保存', icon: 'success' });
          this.setData({ showLogModal: false });
          this.loadExperimentDetail(experimentId);
        });
      }).catch(err => {
        wx.hideLoading();
        console.error('上传或保存失败:', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
    },

  // 预览图片
  previewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ urls, current });
  },

  // 跳转菌种详情
  goStrainDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/strain/detail/detail?id=${id}`
    });
  },

  // 编辑实验
  editExperiment() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 切换状态
  toggleStatus() {
    const { experimentId, experimentInfo } = this.data;
    const newStatus = experimentInfo.status === 'ongoing' ? 'completed' : 'ongoing';

    wx.showModal({
      title: '确认操作',
      content: newStatus === 'completed' ? '确定要完成这个实验吗？' : '确定要重新开始这个实验吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          api.updateExperimentStatus(experimentId, newStatus).then(() => {
            wx.hideLoading();
            wx.showToast({
              title: newStatus === 'completed' ? '实验已完成' : '实验已重新开始',
              icon: 'success'
            });
            this.loadExperimentDetail(experimentId);
          }).catch(err => {
            wx.hideLoading();
            console.error('更新状态失败:', err);
          });
        }
      }
    });
  },
// 测试推送
testPush() {
  const { experimentId, timelineList } = this.data;
  
  if (timelineList.length === 0) {
    wx.showToast({ title: '没有提醒计划', icon: 'none' });
    return;
  }

  // 使用第一个提醒测试
  const firstReminder = timelineList[0];
  
  wx.showLoading({ title: '发送中...' });

  wx.request({
    url: 'http://localhost:3000/api/experiments/test-push',
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + wx.getStorageSync('token')
    },
    data: {
      experimentId: experimentId,
      reminderId: firstReminder.id
    },
    success: (res) => {
      wx.hideLoading();
      if (res.statusCode === 200 && res.data.code === 0) {
        wx.showToast({ title: '推送成功，请查看微信通知', icon: 'success', duration: 3000 });
      } else {
        wx.showToast({ title: '推送失败', icon: 'none' });
      }
    },
    fail: () => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  });
},
  // 删除实验
  deleteExperiment() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个实验吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          api.deleteExperiment(this.data.experimentId).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          }).catch(err => {
            wx.hideLoading();
            console.error('删除失败:', err);
          });
        }
      }
    });
  }
});
