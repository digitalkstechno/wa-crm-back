const resolveTemplateBody = (body, context = {}) => {
  if (!body) return '';

  const customer = context.customer || {};
  const firm = context.firm || {};
  const task = context.task || {};
  const staff = context.staff || {};
  const reminder = context.reminder || {};

  // Formatted task date helper
  let formattedDueDate = '';
  if (task.dueDate) {
    try {
      formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-GB'); // e.g. DD/MM/YYYY
    } catch {
      formattedDueDate = task.dueDate;
    }
  }

  // Formatted reminder date helper
  let formattedReminderDate = '';
  if (reminder.scheduledAt) {
    try {
      formattedReminderDate = new Date(reminder.scheduledAt).toLocaleString('en-GB'); // e.g. DD/MM/YYYY, HH:MM:SS
    } catch {
      formattedReminderDate = reminder.scheduledAt;
    }
  }

  const replacements = {
    '{customerName}': customer.name || context.fallbackCustomerName || 'Customer',
    '{customerEmail}': customer.email || '',
    '{customerPhone}': customer.phone || context.fallbackCustomerPhone || '',
    '{firmName}': firm.name || '',
    '{taskId}': task.taskId || '',
    '{taskTitle}': task.title || '',
    '{taskDueDate}': formattedDueDate || '',
    '{taskDueTime}': task.dueTime || '',
    '{taskDescription}': task.description || '',
    '{reminderTitle}': reminder.title || '',
    '{reminderName}': reminder.reminderName || '',
    '{reminderScheduledAt}': formattedReminderDate || '',
    '{reminderCustomMessage}': reminder.customMessage || '',
    '{staffName}': staff.fullName || '',
    '{staffPhone}': staff.phone || '',
    '{staffEmail}': staff.email || '',
  };

  let resolved = body;
  for (const [key, value] of Object.entries(replacements)) {
    resolved = resolved.split(key).join(String(value !== undefined && value !== null ? value : ''));
  }

  return resolved;
};

module.exports = { resolveTemplateBody };
