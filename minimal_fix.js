// 最小化修复方案
// 1. 先修复创建实验的错误
// 2. 然后在完成实验接口添加最简单的库存扣减

// === 修复创建实验 ===
// 在创建实验接口中，找到所有 reminderRow 并替换为 reminder

// === 添加简单的库存扣减 ===
// 在完成实验接口 router.put('/:id/reminders/:reminderId') 中，
// 在最后的 res.json 之前添加：

if (status === 'done' && reagentUsages && Array.isArray(reagentUsages)) {
  console.log('🧪 处理库存扣减，试剂数量:', reagentUsages.length);
  
  for (const usage of reagentUsages) {
    try {
      if (!usage.reagentName || !usage.amount || !usage.libraryId) {
        console.log('⚠️ 跳过无效试剂:', usage);
        continue;
      }
      
      console.log('🔍 处理试剂:', usage.reagentName, usage.amount, usage.unit);
      
      // 查找试剂
      const [reagents] = await connection.query(
        'SELECT id, name, stock_amount FROM reagents WHERE library_id = ? AND name = ?',
        [usage.libraryId, usage.reagentName]
      );
      
      if (reagents.length === 0) {
        console.log('❌ 试剂未找到:', usage.reagentName);
        continue;
      }
      
      const reagent = reagents[0];
      const currentStock = parseFloat(reagent.stock_amount || 0);
      const useAmount = parseFloat(usage.amount || 0);
      const newStock = currentStock - useAmount;
      
      console.log('💰 库存变化:', {
        name: reagent.name,
        before: currentStock,
        use: useAmount,
        after: newStock
      });
      
      // 更新库存
      await connection.query(
        'UPDATE reagents SET stock_amount = ? WHERE id = ?',
        [newStock, reagent.id]
      );
      
      // 记录操作
      await connection.query(`
        INSERT INTO reagent_actions 
        (id, library_id, reagent_id, action, amount, unit, before_stock, after_stock, 
         experiment_id, reminder_id, user_id, created_at)
        VALUES (?, ?, ?, 'use', ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        usage.libraryId,
        reagent.id,
        useAmount,
        usage.unit || '',
        currentStock,
        newStock,
        req.params.id,
        req.params.reminderId,
        req.user.id
      ]);
      
      console.log('✅ 库存扣减成功:', reagent.name);
      
    } catch (error) {
      console.error('❌ 处理试剂失败:', usage.reagentName, error.message);
    }
  }
}

console.log('🎉 完成实验处理完毕');

// 然后继续原来的 res.json 响应