const Task = require('../model/task');
const { getScopeQuery, assignScopeFields } = require('../utils/scope');

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
      taskDate, dueDate, dueTime
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
    });

    const newTask = new Task(taskData);
    await newTask.save();
    await newTask.populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer']);

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
      taskDate, dueDate, dueTime
    } = req.body;
    
    const updateFields = {
      title, description, type: type || null, status, 
      customer: customer || null,
      assignedTo: assignedTo || null, 
      assignedRM: assignedRM || null, 
      priority,
      taskDate, dueDate, dueTime
    };
    
    const scope = await getScopeQuery(req, 'Task');
    const task = await Task.findOneAndUpdate(
      { _id: id, ...scope },
      updateFields,
      { new: true }
    ).populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer']);
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
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
      .populate(['status', 'assignedTo', 'assignedRM', 'type', 'customer']);
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
