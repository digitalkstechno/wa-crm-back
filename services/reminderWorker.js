const cron = require('node-cron');
const REMINDER = require('../model/reminder');

/**
 * Starts the reminder cron worker.
 * Checks for due reminders every minute.
 */
const initReminderWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('[Reminder Worker] Checking for due reminders...');
    try {
      const now = new Date();
      
      // Find reminders that are scheduled and due
      const dueReminders = await REMINDER.find({
        status: 'Scheduled',
        scheduledAt: { $lte: now }
      });

      if (dueReminders.length === 0) {
        return;
      }

      console.log(`[Reminder Worker] Found ${dueReminders.length} due reminders. Processing...`);

      for (const reminder of dueReminders) {
        try {
          console.log(`[Reminder Worker] Executing reminder: ${reminder.title} for recipient type: ${reminder.recipientType}`);
          
          // --- PLACEHOLDER FOR ACTUAL SENDING LOGIC (e.g., WhatsApp API) ---
          // Since we don't have the explicit API provider yet, we'll simulate a successful send.
          
          // Update status to Sent
          reminder.status = 'Sent';
          await reminder.save();
          
          console.log(`[Reminder Worker] Successfully processed reminder: ${reminder._id}`);
        } catch (err) {
          console.error(`[Reminder Worker] Failed to process reminder: ${reminder._id}`, err);
          // Optionally mark as failed
          reminder.status = 'Failed';
          await reminder.save();
        }
      }
    } catch (error) {
      console.error('[Reminder Worker] Error in cron job:', error);
    }
  });

  console.log('[Reminder Worker] Cron job initialized (running every minute)');
};

module.exports = { initReminderWorker };
