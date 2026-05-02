// 在后端 experiment.js 的第500行左右添加这些调试日志

// 在 expandedUsages 循环中，找到这段代码：
if (source === 'text' && !usage.reagentId) {
  if (!usage.name) {
    await connection.rollback();
    return res.status(400).json({ code: 400, message: '试剂名称不能为空' });
  }
  
  // 添加调试日志
  console.log('🔍 查找试剂:', { 
    name: usage.name, 
    libraryId, 
    source: 'text' 
  });
  
  const [rows] = await connection.query(
    'SELECT * FROM reagents WHERE library_id = ? AND name = ? FOR UPDATE',
    [libraryId, usage.name]
  );
  
  // 添加调试日志
  console.log('🔍 查找结果:', { 
    found: rows.length, 
    reagents: rows.map(r => ({ id: r.id, name: r.name, stock: r.stock_amount }))
  });
  
  if (!rows.length) {
    // 尝试模糊匹配
    const [fuzzyRows] = await connection.query(
      'SELECT * FROM reagents WHERE library_id = ? AND name LIKE ? FOR UPDATE',
      [libraryId, `%${usage.name}%`]
    );
    
    console.log('🔍 模糊匹配结果:', { 
      found: fuzzyRows.length, 
      reagents: fuzzyRows.map(r => ({ id: r.id, name: r.name, stock: r.stock_amount }))
    });
    
    console.log('试剂未入库:', { name: usage.name, libraryId });
    missing.push({
      name: usage.name,
      libraryId,
      unit: unit || '',
      stepIndex: usage.stepIndex,
      stepName: usage.stepName
    });
    continue;
  }
  reagentRow = rows[0];
}