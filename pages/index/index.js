const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    currentDate: '',
    weekDay: '',
    todayTasks: [],
    ongoingExperiments: []
  },

  onLoad() {
    this.setCurrentDate();
  },

  onShow() {
    this.loadData();
  },
// 下拉刷新
onPullDownRefresh() {
  this.loadData().finally(() => {
    wx.stopPullDownRefresh();
  });
},

// 统一加载数据
loadData() {
  if (!app.globalData.isLogin) {
    this.setData({
      todayTasks: [],
      ongoingExperiments: []
    });
    return Promise.resolve();
  }

  return Promise.all([
    this.loadTodayTasks(),
    this.loadOngoingExperiments()
  ]);
},
  // 设置当前日期
  setCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    this.setData({
      currentDate: `${year}年${month}月${day}日`,
      weekDay: weekDays[now.getDay()]
    });
  },

  // 加载数据
  loadData() {
    // 检查是否登录
    if (!app.globalData.isLogin) {
      this.setData({
        todayTasks: [],
        ongoingExperiments: []
      });
      return;
    }

    this.loadTodayTasks();
    this.loadOngoingExperiments();
  },

  // 加载今日待办（改成返回 Promise）
  loadTodayTasks() {
    return api.getTodayTasks().then(res => {
      this.setData({
        todayTasks: res.data || []
      });
    }).catch(err => {
      console.error('获取今日待办失败:', err);
    });
  },

  // 加载进行中的实验（改成返回 Promise）
  loadOngoingExperiments() {
    return api.getExperimentList({ tab: 'ongoing' }).then(res => {
      this.setData({
        ongoingExperiments: (res.data || []).slice(0, 5)
      });
    }).catch(err => {
      console.error('获取实验列表失败:', err);
    });
  },

  // 跳转到任务详情
  goTaskDetail(e) {
    const task = e.currentTarget.dataset.task;
    wx.navigateTo({
      url: `/pages/experiment/detail/detail?id=${task.experimentId}`
    });
  },
  goReagent() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/reagent/reagent'
    });
  },
  // 跳转到实验详情
  goExperimentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/experiment/detail/detail?id=${id}`
    });
  },

  // 跳转新建实验
  goAddExperiment() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/experiment/add/add'
    });
  },

  // 跳转新建菌种
  goAddStrain() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/strain/add/add'
    });
  },

  // 跳转模板管理
  goTemplate() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/template/template'
    });
  },

  // 跳转团队
  goGroup() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({
      url: '/pages/group/group'
    });
  }
});