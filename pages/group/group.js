const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    groupList: [],
    showCreateModal: false,
    showJoinModal: false,
    newGroup: {
      name: '',
      description: ''
    },
    inviteCode: ''
  },

  onLoad() {
  },

  onShow() {
    this.loadGroupList();
  },

  // 加载团队列表
  loadGroupList() {
    if (!app.globalData.isLogin) {
      this.setData({ groupList: [] });
      return;
    }

    api.getGroupList().then(res => {
      this.setData({
        groupList: res.data || []
      });
    }).catch(err => {
      console.error('获取团队列表失败:', err);
    });
  },

  // 跳转团队详情
  goGroupDetail(e) {
    const group = e.currentTarget.dataset.group;
    wx.navigateTo({
      url: `/pages/group/detail/detail?id=${group.id}`
    });
  },

  // 创建团队
  createGroup() {
    this.setData({
      showCreateModal: true,
      newGroup: { name: '', description: '' }
    });
  },

  // 关闭创建弹窗
  closeCreateModal() {
    this.setData({ showCreateModal: false });
  },

  // 输入团队名称
  onGroupNameInput(e) {
    this.setData({
      'newGroup.name': e.detail.value
    });
  },

  // 输入团队描述
  onGroupDescInput(e) {
    this.setData({
      'newGroup.description': e.detail.value
    });
  },

  // 提交创建团队
  submitCreateGroup() {
    const { newGroup } = this.data;

    if (!newGroup.name.trim()) {
      wx.showToast({ title: '请输入团队名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建中...' });

    api.createGroup(newGroup).then(res => {
      wx.hideLoading();
      
      wx.showModal({
        title: '创建成功',
        content: `团队邀请码：${res.data.inviteCode}\n请将邀请码分享给团队成员`,
        showCancel: false,
        success: () => {
          this.setData({ showCreateModal: false });
          this.loadGroupList();
        }
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('创建团队失败:', err);
    });
  },

  // 加入团队
  joinGroup() {
    this.setData({
      showJoinModal: true,
      inviteCode: ''
    });
  },

  // 关闭加入弹窗
  closeJoinModal() {
    this.setData({ showJoinModal: false });
  },

  // 输入邀请码
  onInviteCodeInput(e) {
    this.setData({
      inviteCode: e.detail.value.toUpperCase()
    });
  },

  // 提交加入团队
  submitJoinGroup() {
    const { inviteCode } = this.data;

    if (!inviteCode || inviteCode.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加入中...' });

    api.joinGroup(inviteCode).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.setData({ showJoinModal: false });
      this.loadGroupList();
    }).catch(err => {
      wx.hideLoading();
      console.error('加入团队失败:', err);
    });
  }
});