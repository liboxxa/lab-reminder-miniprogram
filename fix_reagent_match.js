// 在后端 experiment.js 中替换试剂查找逻辑

// 原来的代码：
const [rows] = await connection.query(
  'SELECT * FROM reagents WHERE library_id = ? AND name = ? FOR UPDATE',
  [libraryId, usage.name]
);

// 替换为：
// 1. 先精确匹配
let [rows] = await connection.query(
  'SELECT * FROM reagents WHERE library_id = ? AND name = ? FOR UPDATE',
  [libraryId, usage.name]
);

// 2. 如果没找到，尝试去除空格后匹配
if (!rows.length) {
  const trimmedName = usage.name.trim();
  [rows] = await connection.query(
    'SELECT * FROM reagents WHERE library_id = ? AND TRIM(name) = ? FOR UPDATE',
    [libraryId, trimmedName]
  );
}

// 3. 如果还没找到，尝试模糊匹配
if (!rows.length) {
  [rows] = await connection.query(
    'SELECT * FROM reagents WHERE library_id = ? AND name LIKE ? FOR UPDATE',
    [libraryId, `%${usage.name.trim()}%`]
  );
}

console.log('🔍 试剂匹配结果:', { 
  searchName: usage.name,
  found: rows.length, 
  reagents: rows.map(r => ({ id: r.id, name: r.name, stock: r.stock_amount }))
});