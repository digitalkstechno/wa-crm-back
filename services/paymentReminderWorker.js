const cron = require('node-cron');
const REMINDER = require('../model/paymentReminder');
const Customer = require('../model/customer');

const BATCH_SIZE = 50;
let isProcessing = false;

/**
 * Send a WhatsApp template message to a single phone number.
 * arg1 = customer name, arg2 = paymentReminder ID, arg3 = template body
 */
const sendWhatsApp = async (phone, customerName, reminderId, templateBody) => {
  const WA_API_DOMAIN = process.env.WA_API_DOMAIN || 'https://crmapi.crmbot.in';
  const WA_API_VERSION = process.env.WA_API_VERSION || 'v19.0';
  const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '730141010176205';
  const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
  const WA_TEMPLATE_ID = process.env.WA_TEMPLATE_ID || 'order_data';
  const WA_TEMPLATE_LANG = process.env.WA_TEMPLATE_LANG || 'en';

  if (!WA_ACCESS_TOKEN) {
    throw new Error('WA_ACCESS_TOKEN is missing in environment variables');
  }

  let senderPhone = phone.replace(/[^0-9]/g, '');
  if (!phone.startsWith('+')) {
    if (!senderPhone.startsWith('91')) {
      senderPhone = `91${senderPhone}`;
    }
  }
  console.log('cleanPhone (digits only):', senderPhone, 'senderPhone:', senderPhone);

  const url = `${WA_API_DOMAIN}/api/meta/${WA_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: senderPhone,
    type: "template",
    template: {
      language: {
        policy: "deterministic",
        code: WA_TEMPLATE_LANG
      },
      name: WA_TEMPLATE_ID,
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: customerName
            },
            {
              type: "text",
              text: templateBody
            }
          ]
        }
      ]
    }
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
 * Collect all recipient phone numbers and names for a paymentReminder.
 */
const getRecipients = async (paymentReminder) => {
  const recipients = []; // { name, phone }

  if (paymentReminder.recipientType === 'new') {
    if (paymentReminder.newPhone) {
      recipients.push({ name: paymentReminder.newName || 'Customer', phone: paymentReminder.newPhone });
    }
  } else if (paymentReminder.recipientType === 'customers') {
    // Populated customers array
    if (paymentReminder.customers && paymentReminder.customers.length > 0) {
      for (const c of paymentReminder.customers) {
        if (c.phone) recipients.push({ name: c.name, phone: c.phone });
      }
    }
  } else if (paymentReminder.recipientType === 'groups') {
    // Find all customers belonging to these groups
    if (paymentReminder.groups && paymentReminder.groups.length > 0) {
      const UNGROUPED_GROUP_ID = '000000000000000000000000';
      const rawIds = paymentReminder.groups.map(g => (g._id || g).toString());
      const groupIds = rawIds.filter(id => id !== UNGROUPED_GROUP_ID);
      const hasUngrouped = rawIds.includes(UNGROUPED_GROUP_ID);

      let query;
      if (hasUngrouped) {
        query = {
          $or: [
            { group: { $in: groupIds } },
            { group: null }
          ]
        };
      } else {
        query = { group: { $in: groupIds } };
      }

      const customers = await Customer.find(query)
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
 * Calculate the next scheduled date for a recurring paymentReminder.
 */
const getNextScheduledDate = (paymentReminder) => {
  const { repeat, scheduledAt } = paymentReminder;
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
 * Production paymentReminder worker.
 * - Batch processing (max 50 per tick)
 * - Atomic status claim to prevent race conditions
 * - Sends WhatsApp messages via API
 * - Handles recurring paymentReminders
 */
const initPaymentReminderWorker = () => {
  cron.schedule('* * * * *', async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const now = new Date();

      // Find due paymentReminders with populated data for sending
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

      console.log(`[Worker] Processing ${dueReminders.length} paymentReminders`);

      for (const paymentReminder of dueReminders) {
        try {
          const templateBody = (paymentReminder.template?.body || '').replace(/[\t\n\r]/g, ' ').replace(/ {5,}/g, '    ');
          const recipients = await getRecipients(paymentReminder);

          if (recipients.length === 0) {
            console.warn(`[Worker] No recipients for paymentReminder ${paymentReminder._id}, marking Sent`);
            await REMINDER.updateOne({ _id: paymentReminder._id }, { $set: { status: 'Sent' } });
            continue;
          }

          // Send to all recipients
          let allSent = true;
          for (const { name, phone } of recipients) {
            try {
              await sendWhatsApp(phone, name, paymentReminder._id, templateBody);
              console.log(`[Worker] Sent to ${phone} (${name})`);
            } catch (err) {
              console.error(`[Worker] Failed sending to ${phone}:`, err.message);
              allSent = false;
            }
          }

          await REMINDER.updateOne(
            { _id: paymentReminder._id },
            { $set: { status: allSent ? 'Sent' : 'Failed' } }
          );

          // Handle recurring
          if (paymentReminder.repeat && paymentReminder.repeat.enabled) {
            const nextDate = getNextScheduledDate(paymentReminder);
            if (nextDate) {
              const doc = paymentReminder.toObject();
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
          console.error(`[Worker] Error processing ${paymentReminder._id}:`, err.message);
          await REMINDER.updateOne({ _id: paymentReminder._id }, { $set: { status: 'Failed' } });
        }
      }
    } catch (error) {
      console.error('[Worker] Cron error:', error.message);
    } finally {
      isProcessing = false;
    }
  });

  console.log('[Worker] PaymentReminder cron initialized');
};

module.exports = { initPaymentReminderWorker };
