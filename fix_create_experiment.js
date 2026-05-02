// 修复创建实验的错误
// 在后端 routes/experiment.js 的创建实验接口中，找到第646行附近的代码

// 问题可能出现在这里，检查是否有类似这样的代码：
const reminderUsages = usageList.filter(u => isUsageForReminder(reminder, i, u));

// 如果有引用 reminderRow 的地方，应该改为 reminder
// 例如：
// 错误的代码：
// const stepName = usage.stepName || usage.step_name || reminderRow.content || '';

// 正确的代码：
const stepName = usage.stepName || usage.step_name || reminder.content || '';

// 或者在 isUsageForReminder 函数调用中：
// 确保传递的是 reminder 而不是 reminderRow
const reminderUsages = usageList.filter(u => isUsageForReminder(reminder, i, u));

// 检查创建实验接口中所有 reminderRow 的引用，都应该改为 reminder