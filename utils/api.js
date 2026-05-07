const config = require('./config');

// 获取存储的token
function getToken() {
  return wx.getStorageSync('token') || '';
}

// 封装请求方法
function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    //console.log('发起请求:', options.method || 'GET', options.url, options.data || {});
    let url = config.baseUrl + options.url;
    const cache_buster = `_cb=${Date.now()}_${Math.random()}`;
    url += (url.indexOf('?') > -1 ? '&' : '?') + cache_buster;
    wx.request({
      url: config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',  // ✅ 加这个
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data);
            return;
          }
          // 业务错误
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(res.data);
          return;
        }

        if (res.statusCode === 409) {
          // 库存不足/试剂缺失等冲突
          reject({ statusCode: 409, data: res.data });
          return;
        }

        if (res.statusCode === 401) {
          // 未登录或token过期
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.showToast({
            title: '请重新登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }, 1500);
          reject(res.data);
          return;
        }

        wx.showToast({
          title: res.data.message || '请求失败',
          icon: 'none'
        });
        reject(res.data);
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

// ==================== 试剂库相关 ====================

function getReagentLibraryList() {
  return request({ url: '/reagent-libraries', method: 'GET' });
}

function createReagentLibrary(name) {
  return request({ url: '/reagent-libraries', method: 'POST', data: { name } });
}

function joinReagentLibrary(inviteCode) {
  return request({ url: '/reagent-libraries/join', method: 'POST', data: { inviteCode } });
}

function getReagentLibraryMembers(id) {
  return request({ url: `/reagent-libraries/${id}/members`, method: 'GET' });
}

// ==================== 试剂相关 ====================

function getReagentList(params = {}) {
  return request({
    url: '/reagents',
    method: 'GET',
    data: params
  });
}

function getReagentDetail(id, libraryId) {
  return request({
    url: `/reagents/${id}`,
    method: 'GET',
    data: { libraryId }
  });
}
function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'PUT',
    data
  });
}
function createReagent(data) {
  return request({
    url: '/reagents',
    method: 'POST',
    data
  });
}
// 导出实验数据（返回下载 URL，或者直接在页面逻辑里处理）
function getExportUrl() {
  return config.baseUrl + '/experiments/export';
}
// 导出试剂数据（返回下载 URL）
function getReagentExportUrl() {
  return config.baseUrl + '/reagents/export';
}

function updateReagent(id, data) {
  return request({
    url: `/reagents/${id}`,
    method: 'PUT',
    data
  });
}

function deleteReagent(id, libraryId) {
  return request({
    url: `/reagents/${id}`,
    method: 'DELETE',
    data: { libraryId }
  });
}

// 试剂操作记录
// api.js - getReagentActions 改回干净的写法
function getReagentActions(params = {}) {
  return request({
    url: '/reagents/actions',
    method: 'GET',
    data: params  // _t 由调用方的 buildQuery() 传入
  });
}

function getReagentActionsExportUrl() {
  return config.baseUrl + '/reagents/actions/export';
}

// 批量导入试剂（Excel）
function importReagents(filePath, libraryId) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    wx.uploadFile({
      url: config.baseUrl + '/reagents/import',
      filePath: filePath,
      name: 'file',
      formData: { libraryId },
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data);
            } else {
              reject(data);
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
}

// ==================== 认证相关 ====================

// 微信登录
function login(code, userInfo) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: {
      code,
      nickname: userInfo?.nickName,
      avatar: userInfo?.avatarUrl
    }
  });
}

// 获取用户信息
function getUserInfo() {
  return request({
    url: '/auth/userinfo',
    method: 'GET'
  });
}

// 更新用户设置
function updateSettings(settings) {
  return request({
    url: '/auth/settings',
    method: 'PUT',
    data: settings
  });
}

// ==================== 菌种相关 ====================

// 获取菌种列表
function getStrainList(params = {}) {
  return request({
    url: '/strains',
    method: 'GET',
    data: params
  });
}

// 获取菌种详情
function getStrainDetail(id) {
  return request({
    url: `/strains/${id}`,
    method: 'GET'
  });
}

// 创建菌种
function createStrain(data) {
  return request({
    url: '/strains',
    method: 'POST',
    data
  });
}

// 更新菌种
function updateStrain(id, data) {
  return request({
    url: `/strains/${id}`,
    method: 'PUT',
    data
  });
}

// 删除菌种
function deleteStrain(id) {
  return request({
    url: `/strains/${id}`,
    method: 'DELETE'
  });
}

// 添加菌种操作记录
function addStrainLog(strainId, data) {
  return request({
    url: `/strains/${strainId}/logs`,
    method: 'POST',
    data
  });
}

// ==================== 实验相关 ====================

// 获取实验列表
function getExperimentList(params = {}) {
  return request({
    url: '/experiments',
    method: 'GET',
    data: params
  });
}

// 获取今日待办
function getTodayTasks() {
  return request({
    url: '/experiments/today-tasks',
    method: 'GET'
  });
}

// 获取实验详情
function getExperimentDetail(id) {
  return request({
    url: `/experiments/${id}`,
    method: 'GET'
  });
}

// 创建实验
function createExperiment(data) {
  return request({
    url: '/experiments',
    method: 'POST',
    data
  });
}

// 更新实验状态
function updateExperimentStatus(id, status) {
  return request({
    url: `/experiments/${id}/status`,
    method: 'PUT',
    data: { status }
  });
}

// 完成/跳过提醒任务
function updateReminderStatus(experimentId, reminderId, data) {
  return request({
    url: `/experiments/${experimentId}/reminders/${reminderId}`,
    method: 'PUT',
    data
  });
}

// 添加实验操作日志
function addExperimentLog(experimentId, data) {
  return request({
    url: `/experiments/${experimentId}/logs`,
    method: 'POST',
    data
  });
}

// 删除实验
function deleteExperiment(id) {
  return request({
    url: `/experiments/${id}`,
    method: 'DELETE'
  });
}

// ==================== 模板相关 ====================

// 获取模板列表
function getTemplateList() {
  return request({
    url: '/templates',
    method: 'GET'
  });
}

// 获取模板详情
function getTemplateDetail(id) {
  return request({
    url: `/templates/${id}`,
    method: 'GET'
  });
}

// 创建模板
function createTemplate(data) {
  return request({
    url: '/templates',
    method: 'POST',
    data
  });
}

// 更新模板
function updateTemplate(id, data) {
  return request({
    url: `/templates/${id}`,
    method: 'PUT',
    data
  });
}

// 删除模板
function deleteTemplate(id) {
  return request({
    url: `/templates/${id}`,
    method: 'DELETE'
  });
}

// ==================== 团队相关 ====================

// 获取团队列表
function getGroupList() {
  return request({
    url: '/groups',
    method: 'GET'
  });
}

// 获取团队详情
function getGroupDetail(id) {
  return request({
    url: `/groups/${id}`,
    method: 'GET'
  });
}

// 创建团队
function createGroup(data) {
  return request({
    url: '/groups',
    method: 'POST',
    data
  });
}
// 上传头像文件
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    wx.uploadFile({
      url: config.baseUrl + '/upload/avatar',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success(res) {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            reject(data);
          }
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
}
// 加入团队
function joinGroup(inviteCode) {
  return request({
    url: '/groups/join',
    method: 'POST',
    data: { inviteCode }
  });
}

// 移除成员
function removeMember(groupId, userId) {
  return request({
    url: `/groups/${groupId}/members/${userId}`,
    method: 'DELETE'
  });
}

// 退出团队
function leaveGroup(groupId) {
  return request({
    url: `/groups/${groupId}/leave`,
    method: 'POST'
  });
}

// 解散团队
function deleteGroup(groupId) {
  return request({
    url: `/groups/${groupId}`,
    method: 'DELETE'
  });
}

// ==================== 导出 ====================

module.exports = {
  // 试剂库
  getReagentLibraryList,
  createReagentLibrary,
  joinReagentLibrary,
  getReagentLibraryMembers,
  
  // 认证
  login,
  getUserInfo,
  updateSettings,
  
  // 菌种
  getStrainList,
  getStrainDetail,
  createStrain,
  updateStrain,
  deleteStrain,
  addStrainLog,
  
  // 实验
  getExperimentList,
  getTodayTasks,
  getExperimentDetail,
  createExperiment,
  updateExperimentStatus,
  updateReminderStatus,
  addExperimentLog,
  deleteExperiment,
  
  // 模板
  getTemplateList,
  getTemplateDetail,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  
  // 团队
  getGroupList,
  getGroupDetail,
  createGroup,
  joinGroup,
  removeMember,
  leaveGroup,
  deleteGroup,
  // ...原有导出
  getReagentList,
  getReagentDetail,
  createReagent,
  updateReagent,
  deleteReagent,
  getReagentActions,
  getReagentActionsExportUrl,
  importReagents,
  // ...已有导出
  updateProfile,
  getExportUrl,
  getReagentExportUrl,
  uploadFile
};