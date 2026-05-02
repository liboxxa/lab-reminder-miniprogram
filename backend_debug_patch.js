// 在后端 routes/experiment.js 的 router.put('/:id/reminders/:reminderId') 接口中添加调试日志

// 1. 在接口开始处添加（大约第400行）：
console.log('🚀 收到完成请求:', {
  experimentId: req.params.id,
  reminderId: req.params.reminderId,
  status,
  reagentUsages: JSON.stringify(reagentUsages, null, 2)
});

// 2. 在 normalizeUsageList 调用后添加（大约第450行）：
const usageList = normalizeUsageList(reagentUsages || reminderRow.reagent_usages || []);
console.log('📋 标准化后的使用列表:', JSON.stringify(usageList, null, 2));

// 3. 在 expandedUsages 循环开始前添加（大约第470行）：
console.log('🔄 开始处理试剂使用，共', expandedUsages.length, '项');

// 4. 在每个 usage 处理开始时添加（大约第480行）：
for (const usage of expandedUsages) {
  console.log('🧪 处理试剂:', {
    name: usage.name,
    reagentId: usage.reagentId,
    libraryId: usage.libraryId,
    amount: usage.amount,
    unit: usage.unit,
    source: usage.source
  });

// 5. 在试剂查找前添加（大约第520行）：
if (source === 'text' && !usage.reagentId) {
  console.log('🔍 按名称查找试剂:', { name: usage.name, libraryId });
  
  const [rows] = await connection.query(
    'SELECT * FROM reagents WHERE library_id = ? AND name = ? FOR UPDATE',
    [libraryId, usage.name]
  );
  
  console.log('🔍 查找结果:', {
    found: rows.length,
    reagents: rows.map(r => ({ 
      id: r.id, 
      name: `"${r.name}"`, // 用引号包围，便于看到空格
      stock: r.stock_amount,
      library_id: r.library_id 
    }))
  });

// 6. 在库存扣减前添加（大约第600行）：
console.log('💰 准备扣减库存:', {
  reagentId: reagentRow.id,
  name: reagentRow.name,
  currentStock,
  deductAmount: amount,
  afterStock: currentStock - amount
});

// 7. 在库存扣减后添加（大约第610行）：
await connection.query('UPDATE reagents SET stock_amount = ? WHERE id = ?', [usage.afterStock, usage.reagentId]);
console.log('✅ 库存扣减成功:', { reagentId: usage.reagentId, newStock: usage.afterStock });