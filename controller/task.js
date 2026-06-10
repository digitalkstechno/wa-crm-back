const Task = require('../model/task');
const Template = require('../model/template');
const Customer = require('../model/customer');
const Staff = require('../model/staff');
const { sendWhatsApp } = require('../services/reminderWorker');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

// Helper to send immediate WhatsApp reminders asynchronously in background
const handleImmediateReminders = async (task) => {
  try {
    // 1. Customer Reminder
    if (task.sendCustomerReminder && task.customerTemplate && task.customer) {
      const template = await Template.findById(task.customerTemplate);
      const customer = await Customer.findById(task.customer);
      if (template && customer && customer.phone) {
        console.log(`[Task Reminder] Sending WhatsApp to Customer: ${customer.name} (${customer.phone})`);
        await sendWhatsApp(customer.phone, customer.name, task._id, template.body);
      }
    }

    // 2. Staff Reminder
    if (task.sendStaffReminder && task.staffTemplate && task.assignedTo) {
      const template = await Template.findById(task.staffTemplate);
      const staff = await Staff.findById(task.assignedTo);
      if (template && staff && staff.phone) {
        console.log(`[Task Reminder] Sending WhatsApp to Staff: ${staff.fullName} (${staff.phone})`);
        await sendWhatsApp(staff.phone, staff.fullName, task._id, template.body);
      }
    }
  } catch (error) {
    console.error('[Task Reminder] Error sending immediate reminders:', error.message);
  }
};

// Helper to generate next Task ID
const generateTaskId = async () => {
  const lastTask = await Task.findOne().sort({ createdAt: -1 });
  if (!lastTask || !lastTask.taskId) {
    return 'TSK-0001';
  }
  const lastId = lastTask.taskId;
  const numPart = lastId.replace('TSK-', '');
  const nextNum = parseInt(numPart, 10) + 1;
  return `TSK-${nextNum.toString().padStart(4, '0')}`;
};

exports.createTask = async (req, res) => {
  try {
    const { 
      title, description, type, status, 
      customer,
      assignedTo, assignedRM, priority,
      taskDate, dueDate, dueTime,
      sendCustomerReminder, customerTemplate,
      sendStaffReminder, staffTemplate
    } = req.body;
    
    const taskId = await generateTaskId();

    const taskData = assignScopeFields(req, {
      taskId,
      title,
      description,
      type: type || null,
      status,
      customer: customer || null,
      assignedTo: assignedTo || null,
      assignedRM: assignedRM || null,
      priority,
      taskDate,
      dueDate,
      dueTime,
      sendCustomerReminder: !!sendCustomerReminder,
      customerTemplate: customerTemplate || null,
      sendStaffReminder: !!sendStaffReminder,
      staffTemplate: staffTemplate || null,
    });

    const newTask = new Task(taskData);
    await newTask.save();
    await newTask.populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer', 'customerTemplate', 'staffTemplate']);

    // Call immediate WhatsApp reminder checker in background
    handleImmediateReminders(newTask);

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const scope = await getScopeQuery(req, 'Task');
    const tasks = await Task.find(scope)
      .populate('status')
      .populate('type')
      .populate('customer', 'name phone email')
      .populate('assignedTo', 'fullName email')
      .populate('assignedRM', 'fullName email')
      .populate('customerTemplate', 'name body')
      .populate('staffTemplate', 'name body')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, type, status, 
      customer,
      assignedTo, assignedRM, priority,
      taskDate, dueDate, dueTime,
      sendCustomerReminder, customerTemplate,
      sendStaffReminder, staffTemplate
    } = req.body;
    
    const updateFields = {
      title, description, type: type || null, status, 
      customer: customer || null,
      assignedTo: assignedTo || null, 
      assignedRM: assignedRM || null, 
      priority,
      taskDate, dueDate, dueTime,
      sendCustomerReminder: !!sendCustomerReminder,
      customerTemplate: customerTemplate || null,
      sendStaffReminder: !!sendStaffReminder,
      staffTemplate: staffTemplate || null,
    };
    
    const scope = await getScopeQuery(req, 'Task');
    const task = await Task.findOneAndUpdate(
      { _id: id, ...scope },
      updateFields,
      { new: true }
    ).populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer', 'customerTemplate', 'staffTemplate']);
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Call immediate WhatsApp reminder checker in background
    handleImmediateReminders(task);

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await getScopeQuery(req, 'Task');
    const task = await Task.findOneAndDelete({ _id: id, ...scope });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId } = req.body;

    const scope = await getScopeQuery(req, 'Task');
    const task = await Task.findOneAndUpdate({ _id: id, ...scope }, { status: statusId }, { new: true })
      .populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer', 'customerTemplate', 'staffTemplate']);
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
