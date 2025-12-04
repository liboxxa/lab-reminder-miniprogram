const api = require('../../../utils/api');

Page({
  data: {
    groupId: '',
    groupInfo: {
      name: '',
      description: '',
      inviteCode: '',
      members: [],
      createdAt: ''
    },
    isAdmin: false,
    sharedExperiments: []
  },

  onLoad(options) {
    if (options.id) {
      console.log('📋 接收到团队ID:', options.id);
      this.setData({ groupId: options.id });
    }
  },

  onShow() {
    if (this.data.groupId) {
      this.loadGroupDetail(this.data.groupId);
    }
  },

  // 加载团队详情
  loadGroupDetail(id) {
    console.log('📋 加载团队详情, ID:', id);
    
    api.getGroupDetail(id).then(res => {
      console.log('✅ 获取团队详情成功:', res.data);
      const data = res.data;
      this.setData({
        groupInfo: data,
        isAdmin: data.isAdmin,
        sharedExperiments: data.sharedExperiments || []
      });
      wx.setNavigationBarTitle({ title: data.name });
    }).catch(err => {
      console.error('❌ 获取团队详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    });
  },

  // 复制邀请码
  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.groupInfo.inviteCode,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      }
    });
  },

  // 分享邀请码
  shareInviteCode() {
    const { groupInfo } = this.data;
    wx.showModal({
      title: '邀请成员',
      content: `团队邀请码：${groupInfo.inviteCode}\n请将邀请码分享给要加入的成员`,
      confirmText: '复制邀请码',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: groupInfo.inviteCode,
            success: () => {
              wx.showToast({ title: '已复制', icon: 'success' });
            }
          });
        }
      }
    });
  },

  // 移除成员
  removeMember(e) {
    const userId = e.currentTarget.dataset.userId;
    
    wx.showModal({
      title: '确认移除',
      content: '确定要移除该成员吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.removeMember(this.data.groupId, userId).then(() => {
            wx.showToast({ title: '已移除', icon: 'success' });
            this.loadGroupDetail(this.data.groupId);
          }).catch(err => {
            console.error('移除成员失败:', err);
          });
        }
      }
    });
  },

  // 跳转实验详情
  goExperimentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/experiment/detail/detail?id=${id}`
    });
  },

  // 退出团队
  leaveGroup() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出该团队吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.leaveGroup(this.data.groupId).then(() => {
            wx.showToast({ title: '已退出', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          }).catch(err => {
            console.error('退出团队失败:', err);
          });
        }
      }
    });
  },

  // 解散团队
  deleteGroup() {
    wx.showModal({
      title: '确认解散',
      content: '解散后团队数据将被清除，确定要解散吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          api.deleteGroup(this.data.groupId).then(() => {
            wx.showToast({ title: '已解散', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          }).catch(err => {
            console.error('解散团队失败:', err);
          });
        }
      }
    });
  }
});