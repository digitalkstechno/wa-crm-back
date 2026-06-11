const cron = require('node-cron');
const REMINDER = require('../model/reminder');
const Customer = require('../model/customer');

const BATCH_SIZE = 50;
let isProcessing = false;

/**
 * Send a WhatsApp template message to a single phone number.
 * arg1 = customer name, arg2 = reminder ID, arg3 = template body
 */
const sendWhatsApp = async (phone, customerName, reminderId, templateBody, firmId = null) => {
  let resolvedFirmId = firmId;
  if (!resolvedFirmId && reminderId) {
    try {
      const Reminder = require('../model/reminder');
      const Task = require('../model/task');
      const reminder = await Reminder.findById(reminderId).select('firmId').lean();
      if (reminder && reminder.firmId) {
        resolvedFirmId = reminder.firmId;
      } else {
        const task = await Task.findById(reminderId).select('firmId').lean();
        if (task && task.firmId) {
          resolvedFirmId = task.firmId;
        }
      }
    } catch (err) {
      console.error('[sendWhatsApp] Error resolving firmId:', err.message);
    }
  }

  let firmDoc = null;
  if (resolvedFirmId) {
    try {
      const FIRM = require('../model/firm');
      firmDoc = await FIRM.findById(resolvedFirmId).lean();
    } catch (err) {
      console.error('[sendWhatsApp] Error fetching firm:', err.message);
    }
  }

  // Load context models for placeholders
  let customer = null;
  let task = null;
  let staff = null;
  let reminderDoc = null;
  if (reminderId) {
    try {
      const Reminder = require('../model/reminder');
      const Task = require('../model/task');
      const Customer = require('../model/customer');
      const Staff = require('../model/staff');

      const reminder = await Reminder.findById(reminderId).populate('assignedTo').lean();
      if (reminder) {
        reminderDoc = reminder;
        staff = reminder.assignedTo;
        if (reminder.customer) {
          customer = await Customer.findById(reminder.customer).lean();
        }
      } else {
        task = await Task.findById(reminderId).populate('assignedTo').lean();
        if (task) {
          staff = task.assignedTo;
          if (task.customer) {
            customer = await Customer.findById(task.customer).lean();
          }
        }
      }
    } catch (err) {
      console.error('[sendWhatsApp] Error fetching template context:', err.message);
    }
  }

  const WA_API_DOMAIN = (firmDoc && firmDoc.waApiDomain) || process.env.WA_API_DOMAIN || 'https://crmapi.crmbot.in';
  const WA_API_VERSION = (firmDoc && firmDoc.waApiVersion) || process.env.WA_API_VERSION || 'v19.0';
  const WA_PHONE_NUMBER_ID = (firmDoc && firmDoc.waPhoneNumberId) || process.env.WA_PHONE_NUMBER_ID || '730141010176205';
  const WA_ACCESS_TOKEN = (firmDoc && firmDoc.waAccessToken) || process.env.WA_ACCESS_TOKEN;
  const WA_TEMPLATE_ID = (firmDoc && firmDoc.waTemplateId) || process.env.WA_TEMPLATE_ID || 'order_data';
  const WA_TEMPLATE_LANG = (firmDoc && firmDoc.waTemplateLang) || process.env.WA_TEMPLATE_LANG || 'en';

  if (!WA_ACCESS_TOKEN) {
    throw new Error('WA_ACCESS_TOKEN is missing in both firm settings and environment variables');
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const senderPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  console.log('cleanPhone', cleanPhone, 'senderPhone', senderPhone);

  const url = `${WA_API_DOMAIN}/api/meta/${WA_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`;

  // Parse custom template object or default
  let templateObj = null;
  if (firmDoc && firmDoc.waTemplateJson) {
    try {
      templateObj = typeof firmDoc.waTemplateJson === 'string' ? JSON.parse(firmDoc.waTemplateJson) : firmDoc.waTemplateJson;
    } catch (err) {
      console.error('[sendWhatsApp] Error parsing firm.waTemplateJson:', err.message);
    }
  }

  if (!templateObj) {
    templateObj = {
      name: WA_TEMPLATE_ID,
      language: {
        policy: "deterministic",
        code: WA_TEMPLATE_LANG
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "{customerName}"
            },
            {
              type: "text",
              text: "{randomCode}"
            },
            {
              type: "text",
              text: "{templateBody}"
            }
          ]
        }
      ]
    };
  }

  // First, resolve the message templateBody itself (e.g. from user template editor text)
  const { resolveTemplateBody } = require('../utils/templateResolver');
  const resolvedTemplateBody = resolveTemplateBody(templateBody, {
    customer,
    firm: firmDoc,
    task,
    staff,
    reminder: reminderDoc,
    fallbackCustomerName: customerName,
    fallbackCustomerPhone: phone
  });

  // Now, stringify templateObj and resolve all placeholders inside it (e.g. {customerName}, {randomCode}, {templateBody})
  let templateStr = JSON.stringify(templateObj);
  const randomCode = Math.random().toString().slice(2, 8);
  const replacements = {
    '{customerName}': (customer && customer.name) || customerName || 'Customer',
    '{customerEmail}': (customer && customer.email) || '',
    '{customerPhone}': (customer && customer.phone) || phone || '',
    '{firmName}': (firmDoc && firmDoc.name) || '',
    '{taskId}': (task && task.taskId) || '',
    '{taskTitle}': (task && task.title) || '',
    '{taskDueDate}': (task && task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : ''),
    '{taskDueTime}': (task && task.dueTime) || '',
    '{taskDescription}': (task && task.description) || '',
    '{reminderTitle}': (reminderDoc && reminderDoc.title) || '',
    '{reminderName}': (reminderDoc && reminderDoc.reminderName) || '',
    '{reminderScheduledAt}': (reminderDoc && reminderDoc.scheduledAt ? new Date(reminderDoc.scheduledAt).toLocaleString('en-GB') : ''),
    '{reminderCustomMessage}': (reminderDoc && reminderDoc.customMessage) || '',
    '{staffName}': (staff && staff.fullName) || '',
    '{staffPhone}': (staff && staff.phone) || '',
    '{staffEmail}': (staff && staff.email) || '',
    '{randomCode}': randomCode,
    '{templateBody}': resolvedTemplateBody
  };

  for (const [key, value] of Object.entries(replacements)) {
    templateStr = templateStr.split(key).join(String(value !== undefined && value !== null ? value : ''));
  }

  // Parse back to object
  const resolvedTemplateObj = JSON.parse(templateStr);

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: senderPhone,
    type: "template",
    template: resolvedTemplateObj
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WA_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload),
  });

  const resText = await res.text();
  console.log(`[WA API] Status: ${res.status}, Response: ${resText}`);

  if (!res.ok) {
    throw new Error(`WA API ${res.status}: ${resText}`);
  }

  try { return JSON.parse(resText); } catch { return resText; }
};

/**
 * Collect all recipient phone numbers and names for a reminder.
 */
const getRecipients = async (reminder) => {
  const recipients = []; // { name, phone }

  if (reminder.recipientType === 'new') {
    if (reminder.newPhone) {
      recipients.push({ name: reminder.newName || 'Customer', phone: reminder.newPhone });
    }
  } else if (reminder.recipientType === 'customers') {
    // Populated customers array
    if (reminder.customers && reminder.customers.length > 0) {
      for (const c of reminder.customers) {
        if (c.phone) recipients.push({ name: c.name, phone: c.phone });
      }
    }
  } else if (reminder.recipientType === 'groups') {
    // Find all customers belonging to these groups
    if (reminder.groups && reminder.groups.length > 0) {
      const groupIds = reminder.groups.map(g => g._id || g);
      const customers = await Customer.find({ group: { $in: groupIds } })
        .select('name phone')
        .lean();
      for (const c of customers) {
        if (c.phone) recipients.push({ name: c.name, phone: c.phone });
      }
    }
  }

  return recipients;
};

/**
 * Calculate the next scheduled date for a recurring reminder.
 */
const getNextScheduledDate = (reminder) => {
  const { repeat, scheduledAt } = reminder;
  if (!repeat || !repeat.enabled) return null;

  const current = new Date(scheduledAt);
  const interval = repeat.interval || 1;

  switch (repeat.frequency) {
    case 'day':
      current.setDate(current.getDate() + interval);
      break;
    case 'week':
      if (repeat.days && repeat.days.length > 0) {
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const next = new Date(current);
          next.setDate(next.getDate() + i);
          if (repeat.days.includes(next.getDay())) {
            current.setTime(next.getTime());
            found = true;
            break;
          }
        }
        if (!found) current.setDate(current.getDate() + 7 * interval);
      } else {
        current.setDate(current.getDate() + 7 * interval);
      }
      break;
    case 'month':
      current.setMonth(current.getMonth() + interval);
      if (repeat.monthDay) current.setDate(repeat.monthDay);
      break;
    case 'year':
      current.setFullYear(current.getFullYear() + interval);
      break;
    default:
      return null;
  }

  if (repeat.ends === 'on' && repeat.endDate && current > new Date(repeat.endDate)) return null;
  if (repeat.ends === 'after' && repeat.afterCount != null && repeat.afterCount <= 1) return null;

  return current;
};

/**
 * Production reminder worker.
 * - Batch processing (max 50 per tick)
 * - Atomic status claim to prevent race conditions
 * - Sends WhatsApp messages via API
 * - Handles recurring reminders
 */
const initReminderWorker = () => {
  cron.schedule('* * * * *', async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const now = new Date();

      // Find due reminders with populated data for sending
      const dueReminders = await REMINDER.find({
        status: 'Scheduled',
        scheduledAt: { $lte: now },
      })
        .limit(BATCH_SIZE)
        .populate('template', 'name body')
        .populate('customers', 'name phone')
        .populate('groups', '_id name');

      if (dueReminders.length === 0) return;

      // Claim batch atomically
      const ids = dueReminders.map(r => r._id);
      await REMINDER.updateMany(
        { _id: { $in: ids }, status: 'Scheduled' },
        { $set: { status: 'Pending' } }
      );

      console.log(`[Worker] Processing ${dueReminders.length} reminders`);

      for (const reminder of dueReminders) {
        try {
          const templateBody = (reminder.template?.body || '').replace(/[\t\n\r]/g, ' ').replace(/ {5,}/g, '    ');
          const recipients = await getRecipients(reminder);

          if (recipients.length === 0) {
            console.warn(`[Worker] No recipients for reminder ${reminder._id}, marking Sent`);
            await REMINDER.updateOne({ _id: reminder._id }, { $set: { status: 'Sent' } });
            continue;
          }

          // Send to all recipients
          let allSent = true;
          for (const { name, phone } of recipients) {
            try {
              await sendWhatsApp(phone, name, reminder._id, templateBody, reminder.firmId);
              console.log(`[Worker] Sent to ${phone} (${name})`);
            } catch (err) {
              console.error(`[Worker] Failed sending to ${phone}:`, err.message);
              allSent = false;
            }
          }

          await REMINDER.updateOne(
            { _id: reminder._id },
            { $set: { status: allSent ? 'Sent' : 'Failed' } }
          );

          // Handle recurring
          if (reminder.repeat && reminder.repeat.enabled) {
            const nextDate = getNextScheduledDate(reminder);
            if (nextDate) {
              const doc = reminder.toObject();
              delete doc._id;
              delete doc.createdAt;
              delete doc.updatedAt;
              delete doc.__v;
              await REMINDER.create({
                ...doc,
                scheduledAt: nextDate,
                status: 'Scheduled',
                repeat: {
                  ...doc.repeat,
                  afterCount:
                    doc.repeat?.ends === 'after' && doc.repeat?.afterCount
                      ? doc.repeat.afterCount - 1
                      : doc.repeat?.afterCount,
                },
              });
            }
          }
        } catch (err) {
          console.error(`[Worker] Error processing ${reminder._id}:`, err.message);
          await REMINDER.updateOne({ _id: reminder._id }, { $set: { status: 'Failed' } });
        }
      }
    } catch (error) {
      console.error('[Worker] Cron error:', error.message);
    } finally {
      isProcessing = false;
    }
  });

  console.log('[Worker] Reminder cron initialized');
};

module.exports = { initReminderWorker, sendWhatsApp };
