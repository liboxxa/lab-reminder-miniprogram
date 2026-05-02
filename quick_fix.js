// 临时解决方案：在后端接口中添加一个简化的库存扣减逻辑

// 在 router.put('/:id/reminders/:reminderId') 接口中，
// 找到更新提醒状态的代码（大约在最后），在它之前添加：

if (status === 'done' && reagentUsages && reagentUsages.length > 0) {
  console.log('🧪 开始处理试剂库存扣减');
  
  for (const usage of reagentUsages) {
    if (!usage.reagentName || !usage.amount || !usage.libraryId) {
      console.log('⚠️ 跳过无效试剂:', usage);
      continue;
    }
    
    console.log('🔍 查找试剂:', { 
      name: usage.reagentName, 
      libraryId: usage.libraryId 
    });
    
    // 查找试剂
    const [reagents] = await connection.query(
      'SELECT * FROM reagents WHERE library_id = ? AND name = ?',
      [usage.libraryId, usage.reagentName]
    );
    
    if (reagents.length === 0) {
      console.log('❌ 试剂未找到:', usage.reagentName);
      continue;
    }
    
    const reagent = reagents[0];
    const currentStock = Number(reagent.stock_amount || 0);
    const deductAmount = Number(usage.amount || 0);
    const newStock = currentStock - deductAmount;
    
    console.log('💰 库存信息:', {
      reagentId: reagent.id,
      name: reagent.name,
      currentStock,
      deductAmount,
      newStock
    });
    
    if (newStock < 0) {
      console.log('⚠️ 库存不足，但继续扣减');
    }
    
    // 更新库存
    await connection.query(
      'UPDATE reagents SET stock_amount = ? WHERE id = ?',
      [newStock, reagent.id]
    );
    
    // 记录操作
    const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await connection.query(`
      INSERT INTO reagent_actions 
      (id, library_id, reagent_id, action, amount, unit, before_stock, after_stock, 
       experiment_id, reminder_id, user_id, source, created_at)
      VALUES (?, ?, ?, 'use', ?, ?, ?, ?, ?, ?, ?, 'text', NOW())
    `, [
      actionId,
      usage.libraryId,
      reagent.id,
      deductAmount,
      usage.unit || '',
      currentStock,
      newStock,
      req.params.id,
      req.params.reminderId,
      req.user.id
    ]);
    
    console.log('✅ 库存扣减完成:', { reagentId: reagent.id, actionId });
  }
}

// 然后继续原来的更新提醒状态代码
await connection.query(
  'UPDATE reminders SET status = ? WHERE id = ? AND experiment_id = ?',
  [status, req.params.reminderId, req.params.id]
);