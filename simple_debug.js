// 在后端 routes/experiment.js 中找到这个接口：
// router.put('/:id/reminders/:reminderId', authMiddleware, async (req, res) => {

// 在接口的第一行就添加这个日志：
router.put('/:id/reminders/:reminderId', authMiddleware, async (req, res) => {
  console.log('🚀🚀🚀 收到完成请求 - 开始处理');
  console.log('请求参数:', {
    experimentId: req.params.id,
    reminderId: req.params.reminderId,
    userId: req.user.id
  });
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  
  const { status, content, images, reagentUsages } = req.body;
  
  // 继续原来的代码...
  if (!['done', 'skipped'].includes(status)) {
    console.log('❌ 状态无效:', status);
    return res.status(400).json({
      code: 400,
      message: '无效的状态'
    });
  }
  
  console.log('✅ 状态验证通过，开始数据库操作');
  
  // 继续原来的代码...
}