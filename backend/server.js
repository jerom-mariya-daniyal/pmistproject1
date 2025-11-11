//daniyal code final coding one new
//server.js - COMPLETE PERFECT BACKEND WITH METRICS & NOTIFICATIONS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { origin: 'https://pmistproject1.onrender.com', methods: ['GET', 'POST'], credentials: true }
});

app.use(cors({ origin: 'https://pmistproject1.onrender.com', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

['uploads', 'uploads/photos', 'uploads/attachments'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

mongoose.connect('mongodb://127.0.0.1:27017/pmistdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected')).catch(err => console.error('❌ MongoDB Error:', err));

// SCHEMAS
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  name: String,
  empId: String,
  department: String,
  createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facultyName: String,
  department: String,
  specialLecture: String,
  expertSpeaker: String,
  designation: String,
  institution: String,
  mobile: String,
  beneficiaries: String,
  date: Date,
  time: String,
  summaryPoints: { type: String, required: true },
  participantCount: Number,
  geotaggedPhotos: [{ photoUrl: String, caption: String }],
  attachments: [{ fileName: String, fileUrl: String, fileType: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  feedback: String,
  createdAt: { type: Date, default: Date.now }
});

const taskCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  taskNumber: { type: Number, required: true },
  naacId: { type: String, required: true },
  metricTitle: String,
  benchmarkArea: String,
  targetValue: String,
  timeline: String,
  deadline: Date,
  assignedTo: { type: String, required: true },
  assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToEmail: String,
  department: String,
  remarks: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
  sentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const taskMessageSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['task_assigned', 'task_completed', 'task_message', 'report_status'], required: true },
  title: String,
  message: String,
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Report = mongoose.model('Report', reportSchema);
const Task = mongoose.model('Task', taskSchema);
const TaskCounter = mongoose.model('TaskCounter', taskCounterSchema);
const TaskMessage = mongoose.model('TaskMessage', taskMessageSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const Notification = mongoose.model('Notification', notificationSchema);

async function generateTaskId() {
  const counter = await TaskCounter.findByIdAndUpdate(
    'taskid',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const taskNumber = counter.seq;
  const taskId = 'TASK-' + String(taskNumber).padStart(5, '0');
  return { taskId, taskNumber };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'geotaggedPhotos') {
      cb(null, 'uploads/photos');
    } else {
      cb(null, 'uploads/attachments');
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, 'pmist_secret_2024');
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Access denied' });
  next();
};

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role, empId, department } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: 'User exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name, role: role || 'staff', empId, department });
    const token = jwt.sign({ id: user._id }, 'pmist_secret_2024', { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, empId: user.empId, department: user.department } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, 'pmist_secret_2024', { expiresIn: '30d' });
    res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, empId: user.empId, department: user.department } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REPORT ROUTES
app.post('/api/reports', authMiddleware, upload.fields([
  { name: 'geotaggedPhotos', maxCount: 5 },
  { name: 'attachments', maxCount: 10 }
]), async (req, res) => {
  try {
    const reportData = JSON.parse(req.body.reportData);
    const report = await Report.create({
      ...reportData,
      userId: req.user._id,
      geotaggedPhotos: req.files.geotaggedPhotos?.map(f => ({ photoUrl: '/uploads/photos/' + f.filename, caption: 'Event Photo' })) || [],
      attachments: req.files.attachments?.map(f => ({ fileName: f.originalname, fileUrl: '/uploads/attachments/' + f.filename, fileType: f.mimetype })) || []
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const reports = await Report.find(query).populate('userId', 'name email empId').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('userId');
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reports/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status, feedback }, { new: true }).populate('userId');
    
    // Create notification for staff
    await Notification.create({
      userId: report.userId._id,
      type: 'report_status',
      title: 'Report ' + status,
      message: 'Your report has been ' + status,
      reportId: report._id
    });
    
    // Emit socket notification
    io.emit('notification', { 
      userId: report.userId._id.toString(), 
      type: 'report_status',
      message: 'Your report has been ' + status
    });
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TASK ROUTES WITH METRICS & NOTIFICATIONS
app.post('/api/tasks', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { taskId, taskNumber } = await generateTaskId();
    const staffUser = await User.findOne({ name: req.body.assignedTo, role: 'staff' });
    
    const task = await Task.create({ 
      ...req.body, 
      taskId, 
      taskNumber,
      assignedToUserId: staffUser ? staffUser._id : null,
      assignedToEmail: staffUser ? staffUser.email : null,
      sentAt: new Date()
    });
    
    if (staffUser) {
      // Create notification
      await Notification.create({
        userId: staffUser._id,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `Task ${taskId} - ${req.body.naacId} assigned to you`,
        taskId: task._id
      });
      
      // Emit real-time notification
      io.emit('task_assigned', { 
        userId: staffUser._id.toString(), 
        task: task,
        message: `New task ${taskId} assigned`
      });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find().populate('completedBy', 'name email').populate('assignedToUserId', 'name email').sort({ taskNumber: -1 });
    } else {
      tasks = await Task.find({ assignedTo: req.user.name }).populate('completedBy', 'name email').sort({ taskNumber: -1 });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ONLY ADMIN CAN MARK TASK AS COMPLETE
app.put('/api/tasks/:id/complete', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedBy: req.user._id, completedAt: new Date() },
      { new: true }
    ).populate('completedBy', 'name email').populate('assignedToUserId', 'name email');
    
    // Notify staff about completion
    if (task.assignedToUserId) {
      await Notification.create({
        userId: task.assignedToUserId._id,
        type: 'task_completed',
        title: 'Task Completed',
        message: `Task ${task.taskId} has been marked as completed by admin`,
        taskId: task._id
      });
      
      io.emit('task_completed', { 
        userId: task.assignedToUserId._id.toString(), 
        task: task,
        message: `Task ${task.taskId} completed by admin`
      });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TASK MESSAGING ROUTES
app.post('/api/tasks/:taskId/messages', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    let receiverId;
    if (req.user.role === 'staff') {
      const admin = await User.findOne({ role: 'admin' });
      receiverId = admin._id;
    } else {
      receiverId = task.assignedToUserId;
    }
    
    const taskMessage = await TaskMessage.create({
      taskId: req.params.taskId,
      senderId: req.user._id,
      receiverId: receiverId,
      message: message
    });
    
    const populated = await TaskMessage.findById(taskMessage._id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .populate('taskId', 'taskId naacId metricTitle');
    
    // Create notification
    await Notification.create({
      userId: receiverId,
      type: 'task_message',
      title: 'New Task Message',
      message: `New message on task ${task.taskId}`,
      taskId: task._id
    });
    
    io.emit('task_message', { 
      receiverId: receiverId.toString(), 
      message: populated 
    });
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:taskId/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await TaskMessage.find({ taskId: req.params.taskId })
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTIFICATIONS
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('taskId', 'taskId naacId')
      .populate('reportId', 'specialLecture')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ALL STAFF USERS
app.get('/api/users/staff', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('name email empId department');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CHAT ROUTES
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const chatMessage = await ChatMessage.create({ senderId: req.user._id, receiverId, message });
    const populated = await ChatMessage.findById(chatMessage._id).populate('senderId receiverId', 'name email role');
    io.emit('new_message', populated);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id }
      ]
    }).populate('senderId receiverId', 'name email role').sort({ createdAt: 1 });
    await ChatMessage.updateMany({ senderId: req.params.userId, receiverId: req.user._id, read: false }, { read: true });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat/users/list', authMiddleware, async (req, res) => {
  try {
    const users = req.user.role === 'admin' 
      ? await User.find({ role: 'staff' }).select('name email role empId')
      : await User.find({ role: 'admin' }).select('name email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// STATS
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const totalReports = await Report.countDocuments();
      const approved = await Report.countDocuments({ status: 'approved' });
      const pending = await Report.countDocuments({ status: 'pending' });
      const totalTasks = await Task.countDocuments();
      const completedTasks = await Task.countDocuments({ status: 'completed' });
      res.json({ totalReports, approved, pending, totalTasks, completedTasks });
    } else {
      const totalReports = await Report.countDocuments({ userId: req.user._id });
      const approved = await Report.countDocuments({ userId: req.user._id, status: 'approved' });
      const pending = await Report.countDocuments({ userId: req.user._id, status: 'pending' });
      const myTasks = await Task.countDocuments({ assignedTo: req.user.name });
      const completedTasks = await Task.countDocuments({ assignedTo: req.user.name, status: 'completed' });
      const pendingTasks = await Task.countDocuments({ assignedTo: req.user.name, status: 'pending' });
      res.json({ totalReports, approved, pending, myTasks, completedTasks, pendingTasks });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SOCKET.IO
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => console.log('❌ User disconnected:', socket.id));
});

app.get('/', (req, res) => res.json({ message: 'PMIST API Running ✅' }));

const PORT = 5001;
server.listen(PORT, () => console.log('🚀 Server running on http://localhost:' + PORT));





//email add
// server.js - COMPLETE BACKEND WITH GMAIL EMAIL NOTIFICATIONS
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const http = require('http');
// const socketIO = require('socket.io');
// const nodemailer = require('nodemailer');

// const app = express();
// const server = http.createServer(app);

// const io = socketIO(server, {
//   cors: { origin: process.env.FRONTEND_URL || 'https://pmistproject1.onrender.com', methods: ['GET', 'POST'], credentials: true }
// });

// app.use(cors({ origin: process.env.FRONTEND_URL || 'https://pmistproject1.onrender.com', credentials: true }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static('uploads'));

// ['uploads', 'uploads/photos', 'uploads/attachments'].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// // GMAIL TRANSPORTER CONFIGURATION
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD
//   }
// });

// // Verify email configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.log('❌ Email configuration error:', error);
//   } else {
//     console.log('✅ Email server ready to send messages');
//   }
// });

// // SEND EMAIL FUNCTION
// async function sendTaskAssignmentEmail(staffEmail, staffName, task) {
//   const mailOptions = {
//     from: process.env.GMAIL_USER,
//     to: staffEmail,
//     subject: `🎯 New Task Assigned: ${task.taskId} - ${task.naacId}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//           .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
//           .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
//           .task-id { background: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block; font-weight: bold; color: #667eea; margin: 10px 0; }
//           .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
//           .label { font-weight: bold; color: #555; }
//           .value { color: #333; margin-bottom: 10px; }
//           .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
//           .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>🎯 New Task Assigned!</h1>
//             <p>Hi ${staffName}, you have been assigned a new NAAC task</p>
//           </div>
          
//           <div class="details">
//             <div class="task-id">Task ID: ${task.taskId}</div>
            
//             <div class="value">
//               <span class="label">📋 NAAC Metric:</span> ${task.naacId}
//             </div>
            
//             <div class="value">
//               <span class="label">📌 Title:</span> ${task.metricTitle || 'N/A'}
//             </div>
            
//             <div class="value">
//               <span class="label">🎯 Benchmark Area:</span> ${task.benchmarkArea || 'N/A'}
//             </div>
            
//             <div class="value">
//               <span class="label">📊 Target Value:</span> ${task.targetValue || 'N/A'}
//             </div>
            
//             <div class="value">
//               <span class="label">⏱️ Timeline:</span> ${task.timeline || 'N/A'}
//             </div>
            
//             ${task.deadline ? `
//             <div class="value" style="color: #e74c3c;">
//               <span class="label">📅 Deadline:</span> ${new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//             </div>
//             ` : ''}
            
//             ${task.remarks ? `
//             <div class="value">
//               <span class="label">💬 Remarks:</span> ${task.remarks}
//             </div>
//             ` : ''}
//           </div>
          
//           <div style="text-align: center;">
//             <a href="${process.env.FRONTEND_URL || 'https://pmistproject1.onrender.com'}" class="button">
//               📱 View Task in PMIST Portal
//             </a>
//           </div>
          
//           <div class="footer">
//             <p>This is an automated email from PMIST - Performance Management Information System</p>
//             <p>Please do not reply to this email</p>
//             <p>Login to PMIST portal to view full task details and communicate with admin</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('✅ Email sent successfully:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('❌ Email sending failed:', error);
//     return { success: false, error: error.message };
//   }
// }

// // SEND TASK COMPLETION EMAIL
// async function sendTaskCompletionEmail(staffEmail, staffName, task) {
//   const mailOptions = {
//     from: process.env.GMAIL_USER,
//     to: staffEmail,
//     subject: `✅ Task Completed: ${task.taskId} - ${task.naacId}`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//           .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
//           .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
//           .task-id { background: #e8f5e9; padding: 10px; border-radius: 5px; display: inline-block; font-weight: bold; color: #2e7d32; margin: 10px 0; }
//           .message { text-align: center; font-size: 18px; color: #333; margin: 20px 0; }
//           .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>✅ Task Completed!</h1>
//             <p>Great news ${staffName}!</p>
//           </div>
          
//           <div class="task-id">Task ID: ${task.taskId}</div>
          
//           <div class="message">
//             <p>Your task <strong>${task.naacId} - ${task.metricTitle}</strong> has been marked as <strong style="color: #2e7d32;">COMPLETED</strong> by the admin!</p>
//             <p style="font-size: 40px; margin: 20px 0;">🎉</p>
//             <p>Thank you for your excellent work!</p>
//           </div>
          
//           <div class="footer">
//             <p>This is an automated email from PMIST</p>
//             <p>Login to portal to view more details</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('✅ Completion email sent to:', staffEmail);
//   } catch (error) {
//     console.error('❌ Completion email failed:', error);
//   }
// }

// mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pmistdb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log('✅ MongoDB Connected')).catch(err => console.error('❌ MongoDB Error:', err));

// // SCHEMAS
// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
//   name: String,
//   empId: String,
//   department: String,
//   createdAt: { type: Date, default: Date.now }
// });

// const reportSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   facultyName: String,
//   department: String,
//   specialLecture: String,
//   expertSpeaker: String,
//   designation: String,
//   institution: String,
//   mobile: String,
//   beneficiaries: String,
//   date: Date,
//   time: String,
//   summaryPoints: { type: String, required: true },
//   participantCount: Number,
//   geotaggedPhotos: [{ photoUrl: String, caption: String }],
//   attachments: [{ fileName: String, fileUrl: String, fileType: String }],
//   status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//   feedback: String,
//   createdAt: { type: Date, default: Date.now }
// });

// const taskCounterSchema = new mongoose.Schema({
//   _id: { type: String, required: true },
//   seq: { type: Number, default: 0 }
// });

// const taskSchema = new mongoose.Schema({
//   taskId: { type: String, required: true, unique: true },
//   taskNumber: { type: Number, required: true },
//   naacId: { type: String, required: true },
//   metricTitle: String,
//   benchmarkArea: String,
//   targetValue: String,
//   timeline: String,
//   deadline: Date,
//   assignedTo: { type: String, required: true },
//   assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   assignedToEmail: String,
//   department: String,
//   remarks: String,
//   status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
//   completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   completedAt: Date,
//   emailSent: { type: Boolean, default: false },
//   emailSentAt: Date,
//   sentAt: { type: Date, default: Date.now },
//   createdAt: { type: Date, default: Date.now }
// });

// const taskMessageSchema = new mongoose.Schema({
//   taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
//   senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   message: { type: String, required: true },
//   read: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// const chatMessageSchema = new mongoose.Schema({
//   senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   message: { type: String, required: true },
//   read: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// const notificationSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   type: { type: String, enum: ['task_assigned', 'task_completed', 'task_message', 'report_status'], required: true },
//   title: String,
//   message: String,
//   taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
//   reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
//   read: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);
// const Report = mongoose.model('Report', reportSchema);
// const Task = mongoose.model('Task', taskSchema);
// const TaskCounter = mongoose.model('TaskCounter', taskCounterSchema);
// const TaskMessage = mongoose.model('TaskMessage', taskMessageSchema);
// const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
// const Notification = mongoose.model('Notification', notificationSchema);

// async function generateTaskId() {
//   const counter = await TaskCounter.findByIdAndUpdate(
//     'taskid',
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true }
//   );
//   const taskNumber = counter.seq;
//   const taskId = 'TASK-' + String(taskNumber).padStart(5, '0');
//   return { taskId, taskNumber };
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === 'geotaggedPhotos') {
//       cb(null, 'uploads/photos');
//     } else {
//       cb(null, 'uploads/attachments');
//     }
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ error: 'No token' });
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pmist_secret_2024');
//     req.user = await User.findById(decoded.id);
//     if (!req.user) return res.status(401).json({ error: 'User not found' });
//     next();
//   } catch (error) {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// const requireRole = (role) => (req, res, next) => {
//   if (req.user.role !== role) return res.status(403).json({ error: 'Access denied' });
//   next();
// };

// // AUTH ROUTES
// app.post('/api/auth/signup', async (req, res) => {
//   try {
//     const { email, password, name, role, empId, department } = req.body;
//     if (await User.findOne({ email })) return res.status(400).json({ error: 'User exists' });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({ email, password: hashedPassword, name, role: role || 'staff', empId, department });
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'pmist_secret_2024', { expiresIn: '30d' });
//     res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, empId: user.empId, department: user.department } });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { email, password, role } = req.body;
//     const user = await User.findOne({ email, role });
//     if (!user) return res.status(400).json({ error: 'Invalid credentials' });
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'pmist_secret_2024', { expiresIn: '30d' });
//     res.json({ token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, empId: user.empId, department: user.department } });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // REPORT ROUTES
// app.post('/api/reports', authMiddleware, upload.fields([
//   { name: 'geotaggedPhotos', maxCount: 5 },
//   { name: 'attachments', maxCount: 10 }
// ]), async (req, res) => {
//   try {
//     const reportData = JSON.parse(req.body.reportData);
//     const report = await Report.create({
//       ...reportData,
//       userId: req.user._id,
//       geotaggedPhotos: req.files.geotaggedPhotos?.map(f => ({ photoUrl: '/uploads/photos/' + f.filename, caption: 'Event Photo' })) || [],
//       attachments: req.files.attachments?.map(f => ({ fileName: f.originalname, fileUrl: '/uploads/attachments/' + f.filename, fileType: f.mimetype })) || []
//     });
//     res.json(report);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/reports', authMiddleware, async (req, res) => {
//   try {
//     const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
//     const reports = await Report.find(query).populate('userId', 'name email empId').sort({ createdAt: -1 });
//     res.json(reports);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/reports/:id', authMiddleware, async (req, res) => {
//   try {
//     const report = await Report.findById(req.params.id).populate('userId');
//     if (!report) return res.status(404).json({ error: 'Not found' });
//     res.json(report);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.put('/api/reports/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { status, feedback } = req.body;
//     const report = await Report.findByIdAndUpdate(req.params.id, { status, feedback }, { new: true }).populate('userId');
    
//     await Notification.create({
//       userId: report.userId._id,
//       type: 'report_status',
//       title: 'Report ' + status,
//       message: 'Your report has been ' + status,
//       reportId: report._id
//     });
    
//     io.emit('notification', { 
//       userId: report.userId._id.toString(), 
//       type: 'report_status',
//       message: 'Your report has been ' + status
//     });
    
//     res.json(report);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // TASK ROUTES WITH EMAIL NOTIFICATIONS
// app.post('/api/tasks', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { taskId, taskNumber } = await generateTaskId();
//     const staffUser = await User.findOne({ name: req.body.assignedTo, role: 'staff' });
    
//     if (!staffUser) {
//       return res.status(400).json({ error: 'Staff member not found' });
//     }
    
//     const task = await Task.create({ 
//       ...req.body, 
//       taskId, 
//       taskNumber,
//       assignedToUserId: staffUser._id,
//       assignedToEmail: staffUser.email,
//       sentAt: new Date()
//     });
    
//     // Create notification
//     await Notification.create({
//       userId: staffUser._id,
//       type: 'task_assigned',
//       title: 'New Task Assigned',
//       message: `Task ${taskId} - ${req.body.naacId} assigned to you`,
//       taskId: task._id
//     });
    
//     // Emit socket notification
//     io.emit('task_assigned', { 
//       userId: staffUser._id.toString(), 
//       task: task,
//       message: `New task ${taskId} assigned`
//     });
    
//     // SEND EMAIL TO STAFF
//     const emailResult = await sendTaskAssignmentEmail(staffUser.email, staffUser.name, task);
    
//     if (emailResult.success) {
//       await Task.findByIdAndUpdate(task._id, { 
//         emailSent: true, 
//         emailSentAt: new Date() 
//       });
//     }
    
//     res.json({ 
//       task, 
//       emailSent: emailResult.success,
//       message: emailResult.success ? 'Task assigned and email sent successfully!' : 'Task assigned but email failed to send'
//     });
    
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/tasks', authMiddleware, async (req, res) => {
//   try {
//     let tasks;
//     if (req.user.role === 'admin') {
//       tasks = await Task.find().populate('completedBy', 'name email').populate('assignedToUserId', 'name email').sort({ taskNumber: -1 });
//     } else {
//       tasks = await Task.find({ assignedTo: req.user.name }).populate('completedBy', 'name email').sort({ taskNumber: -1 });
//     }
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
//   try {
//     const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // ONLY ADMIN CAN MARK TASK AS COMPLETE (WITH EMAIL)
// app.put('/api/tasks/:id/complete', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const task = await Task.findByIdAndUpdate(
//       req.params.id,
//       { status: 'completed', completedBy: req.user._id, completedAt: new Date() },
//       { new: true }
//     ).populate('completedBy', 'name email').populate('assignedToUserId', 'name email');
    
//     if (task.assignedToUserId) {
//       await Notification.create({
//         userId: task.assignedToUserId._id,
//         type: 'task_completed',
//         title: 'Task Completed',
//         message: `Task ${task.taskId} has been marked as completed by admin`,
//         taskId: task._id
//       });
      
//       io.emit('task_completed', { 
//         userId: task.assignedToUserId._id.toString(), 
//         task: task,
//         message: `Task ${task.taskId} completed by admin`
//       });
      
//       // SEND COMPLETION EMAIL
//       await sendTaskCompletionEmail(
//         task.assignedToUserId.email, 
//         task.assignedToUserId.name, 
//         task
//       );
//     }
    
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.delete('/api/tasks/:id', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     await Task.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Deleted' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // TASK MESSAGING ROUTES
// app.post('/api/tasks/:taskId/messages', authMiddleware, async (req, res) => {
//   try {
//     const { message } = req.body;
//     const task = await Task.findById(req.params.taskId);
//     if (!task) return res.status(404).json({ error: 'Task not found' });
    
//     let receiverId;
//     if (req.user.role === 'staff') {
//       const admin = await User.findOne({ role: 'admin' });
//       receiverId = admin._id;
//     } else {
//       receiverId = task.assignedToUserId;
//     }
    
//     const taskMessage = await TaskMessage.create({
//       taskId: req.params.taskId,
//       senderId: req.user._id,
//       receiverId: receiverId,
//       message: message
//     });
    
//     const populated = await TaskMessage.findById(taskMessage._id)
//       .populate('senderId', 'name email role')
//       .populate('receiverId', 'name email role')
//       .populate('taskId', 'taskId naacId metricTitle');
    
//     await Notification.create({
//       userId: receiverId,
//       type: 'task_message',
//       title: 'New Task Message',
//       message: `New message on task ${task.taskId}`,
//       taskId: task._id
//     });
    
//     io.emit('task_message', { 
//       receiverId: receiverId.toString(), 
//       message: populated 
//     });
    
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/tasks/:taskId/messages', authMiddleware, async (req, res) => {
//   try {
//     const messages = await TaskMessage.find({ taskId: req.params.taskId })
//       .populate('senderId', 'name email role')
//       .populate('receiverId', 'name email role')
//       .sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // NOTIFICATIONS
// app.get('/api/notifications', authMiddleware, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ userId: req.user._id })
//       .populate('taskId', 'taskId naacId')
//       .populate('reportId', 'specialLecture')
//       .sort({ createdAt: -1 })
//       .limit(20);
//     res.json(notifications);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findByIdAndUpdate(
//       req.params.id,
//       { read: true },
//       { new: true }
//     );
//     res.json(notification);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/users/staff', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const staff = await User.find({ role: 'staff' }).select('name email empId department');
//     res.json(staff);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // CHAT ROUTES
// app.post('/api/chat', authMiddleware, async (req, res) => {
//   try {
//     const { receiverId, message } = req.body;
//     const chatMessage = await ChatMessage.create({ senderId: req.user._id, receiverId, message });
//     const populated = await ChatMessage.findById(chatMessage._id).populate('senderId receiverId', 'name email role');
//     io.emit('new_message', populated);
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/chat/:userId', authMiddleware, async (req, res) => {
//   try {
//     const messages = await ChatMessage.find({
//       $or: [
//         { senderId: req.user._id, receiverId: req.params.userId },
//         { senderId: req.params.userId, receiverId: req.user._id }
//       ]
//     }).populate('senderId receiverId', 'name email role').sort({ createdAt: 1 });
//     await ChatMessage.updateMany({ senderId: req.params.userId, receiverId: req.user._id, read: false }, { read: true });
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/chat/users/list', authMiddleware, async (req, res) => {
//   try {
//     const users = req.user.role === 'admin' 
//       ? await User.find({ role: 'staff' }).select('name email role empId')
//       : await User.find({ role: 'admin' }).select('name email role');
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // STATS
// app.get('/api/stats', authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role === 'admin') {
//       const totalReports = await Report.countDocuments();
//       const approved = await Report.countDocuments({ status: 'approved' });
//       const pending = await Report.countDocuments({ status: 'pending' });
//       const totalTasks = await Task.countDocuments();
//       const completedTasks = await Task.countDocuments({ status: 'completed' });
//       const emailsSent = await Task.countDocuments({ emailSent: true });
//       res.json({ totalReports, approved, pending, totalTasks, completedTasks, emailsSent });
//     } else {
//       const totalReports = await Report.countDocuments({ userId: req.user._id });
//       const approved = await Report.countDocuments({ userId: req.user._id, status: 'approved' });
//       const pending = await Report.countDocuments({ userId: req.user._id, status: 'pending' });
//       const myTasks = await Task.countDocuments({ assignedTo: req.user.name });
//       const completedTasks = await Task.countDocuments({ assignedTo: req.user.name, status: 'completed' });
//       const pendingTasks = await Task.countDocuments({ assignedTo: req.user.name, status: 'pending' });
//       res.json({ totalReports, approved, pending, myTasks, completedTasks, pendingTasks });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // TEST EMAIL ENDPOINT
// app.post('/api/test-email', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { email, name } = req.body;
    
//     const testMailOptions = {
//       from: process.env.GMAIL_USER,
//       to: email,
//       subject: '✅ PMIST Email Configuration Test',
//       html: `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//             .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
//             .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>✅ Email Test Successful!</h1>
//             </div>
//             <p>Hi ${name || 'User'},</p>
//             <p>This is a test email from PMIST system.</p>
//             <p>Your email configuration is working perfectly! 🎉</p>
//             <p>You will now receive task assignment notifications at this email address.</p>
//           </div>
//         </body>
//         </html>
//       `
//     };
    
//     await transporter.sendMail(testMailOptions);
//     res.json({ success: true, message: 'Test email sent successfully!' });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // SOCKET.IO
// io.on('connection', (socket) => {
//   console.log('✅ User connected:', socket.id);
//   socket.on('join', (userId) => socket.join(userId));
//   socket.on('disconnect', () => console.log('❌ User disconnected:', socket.id));
// });

// app.get('/', (req, res) => res.json({ 
//   message: 'PMIST API Running ✅',
//   emailConfigured: !!process.env.GMAIL_USER
// }));

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//   console.log('🚀 Server running on http://localhost:' + PORT);
//   console.log('📧 Email service:', process.env.GMAIL_USER ? 'Configured ✅' : 'Not configured ❌');
// });
