//daniyal code final coding one new
import React, { useState, useEffect, useRef } from 'react';
import { Building2, LogOut, CheckSquare, FileText, Upload, MessageSquare, Plus, Eye, X, Send, Target, Download, Trash2, CheckCircle, XCircle, BarChart3, MessageCircle, Bell, Calendar, Clock } from 'lucide-react';

const API = 'http://localhost:5001/api';

const NAAC_METRICS = [
  { id: 'NAAC 1.6', title: 'Indian Knowledge System', area: 'Workshops/seminars on IKS' },
  { id: 'NAAC 1.6', title: 'Indian Knowledge System', area: 'Student projects/researches on IKS' },
  { id: 'NAAC 5.3', title: 'Industry Academia Linkage', area: 'Lectures by industry experts' },
  { id: 'NAAC 5.3', title: 'Industry Academia Linkage', area: 'Collaborative workshop/seminar' },
  { id: 'NAAC 5.3', title: 'Industry Academia Linkage', area: 'Field/Industry visit' },
  { id: 'NAAC 5.3', title: 'Industry Academia Linkage', area: 'Internships outside curriculum' },
  { id: 'NAAC 5.5', title: 'Catering to diversity', area: 'Bridge courses' },
  { id: 'NAAC 5.5', title: 'Catering to diversity', area: 'Enrichment courses' },
  { id: 'NAAC 5.5', title: 'Catering to diversity', area: 'Language proficiency courses' },
  { id: 'NBA 1.7.1.0', title: 'Design related activities', area: 'Domain/Club Activities' }
];

const api = {
  post: async (url, data, token) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(API + url, { method: 'POST', headers: h, body: JSON.stringify(data) });
    return r.json();
  },
  get: async (url, token) => {
    const h = {};
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(API + url, { headers: h });
    return r.json();
  },
  put: async (url, data, token) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(API + url, { method: 'PUT', headers: h, body: JSON.stringify(data) });
    return r.json();
  },
  delete: async (url, token) => {
    const h = {};
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(API + url, { method: 'DELETE', headers: h });
    return r.json();
  },
  upload: async (url, formData, token) => {
    const h = {};
    if (token) h.Authorization = 'Bearer ' + token;
    const r = await fetch(API + url, { method: 'POST', headers: h, body: formData });
    return r.json();
  }
};

function Card({children, className}) {
  return <div className={'bg-white rounded-3xl shadow-2xl border-2 border-purple-100 p-8 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-200 ' + (className || '')}>{children}</div>;
}

function Btn({children, onClick, variant, icon: Icon, disabled, className, type}) {
  const v = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/50',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/50',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/50',
    purple: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/50'
  };
  return (
    <button 
      type={type || 'button'} 
      onClick={onClick} 
      disabled={disabled} 
      className={v[variant || 'primary'] + ' text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 ' + (disabled ? 'opacity-50' : '') + ' ' + (className || '')}
    >
      {Icon && <Icon className="w-5 h-5"/>}
      <span>{children}</span>
    </button>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const handleLogin = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="animate-bounce">
          <Building2 className="w-24 h-24 text-white"/>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;
  
  if (user.role === 'admin') {
    return <AdminDashboard user={user} token={token} onLogout={handleLogout} />;
  } else {
    return <StaffPortal user={user} token={token} onLogout={handleLogout} />;
  }
}

function LoginPage({onLogin}) {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fd, setFd] = useState({email: '', password: '', role: 'staff', name: '', empId: '', department: ''});

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post(isSignup ? '/auth/signup' : '/auth/login', fd);
      if (res.error) {
        setError(res.error);
      } else {
        onLogin(res.user, res.token);
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 hover:scale-105">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Building2 className="w-10 h-10 text-white"/>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PMIST</h1>
          <p className="text-gray-600 mt-2">Accreditation Management System</p>
        </div>
        
        <div className="flex mb-6 bg-gray-100 rounded-2xl p-1">
          <button onClick={() => {setIsSignup(false); setError('');}} className={'flex-1 py-3 rounded-xl font-medium transition-all duration-300 ' + (!isSignup ? 'bg-white shadow-lg text-purple-600 transform scale-105' : 'text-gray-600')}>Login</button>
          <button onClick={() => {setIsSignup(true); setError('');}} className={'flex-1 py-3 rounded-xl font-medium transition-all duration-300 ' + (isSignup ? 'bg-white shadow-lg text-purple-600 transform scale-105' : 'text-gray-600')}>Sign Up</button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm flex items-center space-x-2 animate-shake">
            <XCircle className="w-5 h-5"/>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={submit} className="space-y-4">
          {isSignup && <input type="text" placeholder="Full Name" value={fd.name} onChange={(e) => setFd({...fd, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" required={isSignup} />}
          {isSignup && fd.role === 'staff' && (
            <>
              <input type="text" placeholder="Employee ID" value={fd.empId} onChange={(e) => setFd({...fd, empId: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
              <input type="text" placeholder="Department" value={fd.department} onChange={(e) => setFd({...fd, department: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
            </>
          )}
          <input type="email" placeholder="Email" value={fd.email} onChange={(e) => setFd({...fd, email: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" required />
          <input type="password" placeholder="Password" value={fd.password} onChange={(e) => setFd({...fd, password: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" required />
          <select value={fd.role} onChange={(e) => setFd({...fd, role: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
            {loading ? 'Wait...' : (isSignup ? 'Create Account' : 'Login')}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          {isSignup ? 'Have account?' : 'No account?'}{' '}
          <button onClick={() => {setIsSignup(!isSignup); setError('');}} className="text-purple-600 font-semibold hover:underline">
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({user, token, onLogout}) {
  const [tab, setTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
    loadNotifications();
  }, []);

  const loadData = async () => {
    try {
      const r = await api.get('/reports', token);
      const t = await api.get('/tasks', token);
      const s = await api.get('/stats', token);
      setReports(Array.isArray(r) ? r : []);
      setTasks(Array.isArray(t) ? t : []);
      setStats(s || {});
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotifications = async () => {
    try {
      const n = await api.get('/notifications', token);
      setNotifications(Array.isArray(n) ? n : []);
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id, status) => {
    await api.put('/reports/' + id + '/status', {status}, token);
    loadData();
    setSelected(null);
  };

  const downloadReports = () => {
    const csv = 'ID,Faculty,Event,Date,Status\n' + reports.map(r => r._id + ',' + (r.facultyName || '') + ',' + (r.specialLecture || '') + ',' + new Date(r.createdAt).toLocaleDateString() + ',' + r.status).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reports.csv';
    a.click();
  };

  const downloadTasks = () => {
    const csv = 'TaskID,NAACID,Metric,AssignedTo,Status\n' + tasks.map(t => t.taskId + ',' + t.naacId + ',' + (t.metricTitle || '') + ',' + t.assignedTo + ',' + t.status).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
  };

  const menuItems = [
    {id: 'dashboard', label: 'Dashboard', icon: BarChart3},
    {id: 'reports', label: 'Reports', icon: CheckSquare},
    {id: 'tasks', label: 'Tasks', icon: Target},
    {id: 'chat', label: 'Chat', icon: MessageSquare}
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      
      <div className={(menuOpen ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0 fixed lg:relative w-80 h-full bg-white/10 backdrop-blur-xl border-r border-white/20 transition-all duration-300 z-40 overflow-y-auto'}>
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
              <Building2 className="w-8 h-8 text-purple-600"/>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">PMIST</h2>
              <p className="text-white/60 text-sm">Admin Portal</p>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">{user.name ? user.name.charAt(0) : 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{user.name}</p>
                <p className="text-white/60 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
          {notifications.filter(n => !n.read).length > 0 && (
            <div className="mt-4 p-3 bg-yellow-500 rounded-2xl animate-bounce">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-white"/>
                <p className="text-white text-sm font-semibold">{notifications.filter(n => !n.read).length} new notifications</p>
              </div>
            </div>
          )}
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => {setTab(item.id); setMenuOpen(false);}} className={'w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ' + (tab === item.id ? 'bg-white text-purple-600 shadow-2xl' : 'text-white/60 hover:text-white hover:bg-white/5')}>
              <item.icon className="w-6 h-6"/>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <Btn variant="danger" icon={LogOut} onClick={onLogout} className="w-full justify-center">Logout</Btn>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <header className="bg-white border-b-4 border-purple-200 px-8 py-6 sticky top-0 z-10 shadow-xl">
          <h1 className="text-4xl font-black capitalize bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{tab}</h1>
          <p className="text-gray-600 mt-1">Welcome {user.name}</p>
        </header>

        <div className="p-8">
          {tab === 'dashboard' && <DashboardView stats={stats} reports={reports} tasks={tasks} />}
          {tab === 'reports' && <ReportsView reports={reports} onView={setSelected} onDownload={downloadReports} />}
          {tab === 'tasks' && <TasksView tasks={tasks} token={token} onUpdate={loadData} onDownload={downloadTasks} onViewTask={setSelectedTask} />}
          {tab === 'chat' && <ChatView user={user} token={token} />}
        </div>
      </div>

      {selected && <ReportModal report={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} />}
      {selectedTask && <TaskMessagingModal task={selectedTask} user={user} token={token} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function DashboardView({stats, reports, tasks}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          {label: 'Total Reports', value: stats.totalReports || 0, color: 'from-blue-500 to-blue-600', icon: FileText},
          {label: 'Approved', value: stats.approved || 0, color: 'from-green-500 to-green-600', icon: CheckCircle},
          {label: 'Pending', value: stats.pending || 0, color: 'from-yellow-500 to-yellow-600', icon: Clock},
          {label: 'Total Tasks', value: stats.totalTasks || 0, color: 'from-purple-500 to-purple-600', icon: Target},
          {label: 'Completed', value: stats.completedTasks || 0, color: 'from-pink-500 to-pink-600', icon: CheckSquare}
        ].map((stat, i) => (
          <div key={i} className={'bg-gradient-to-br ' + stat.color + ' text-white rounded-3xl p-6 shadow-2xl transform transition-all duration-300 hover:scale-110 cursor-pointer'}>
            <div className="flex justify-between items-start mb-2">
              <p className="text-white/80 text-sm">{stat.label}</p>
              <stat.icon className="w-6 h-6 text-white/60"/>
            </div>
            <p className="text-5xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Recent Reports</h3>
          <div className="space-y-3">
            {reports.slice(0, 5).map(r => (
              <div key={r._id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl flex justify-between items-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div>
                  <p className="font-bold text-sm">{r.specialLecture || 'Report'}</p>
                  <p className="text-xs text-gray-600">{r.userId && r.userId.name ? r.userId.name : 'Unknown'}</p>
                </div>
                <span className={'px-3 py-1 rounded-full text-xs font-bold shadow-lg ' + (r.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Recent Tasks</h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map(t => (
              <div key={t._id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-sm">{t.metricTitle}</p>
                  <span className={'px-2 py-1 rounded-full text-xs font-bold shadow-lg ' + (t.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{t.naacId} - {t.assignedTo}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportsView({reports, onView, onDownload}) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">All Staff Reports</h3>
        <Btn variant="primary" icon={Download} onClick={onDownload}>Download</Btn>
      </div>
      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse"/>
          <p>No reports yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r._id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl flex justify-between items-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
              <div>
                <h4 className="font-bold text-lg">{r.specialLecture || 'Report'}</h4>
                <p className="text-sm text-gray-600">By: {r.userId && r.userId.name} ({r.userId && r.userId.empId})</p>
                <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={'px-4 py-2 rounded-full text-sm font-bold shadow-lg ' + (r.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : r.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                  {r.status}
                </span>
                <button onClick={() => onView(r)} className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-110">
                  <Eye className="w-5 h-5 text-white"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TasksView({tasks, token, onUpdate, onDownload, onViewTask}) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({naacId: '', metricTitle: '', benchmarkArea: '', targetValue: '', timeline: '', deadline: '', assignedTo: '', department: '', remarks: ''});
  const [staff, setStaff] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const s = await api.get('/users/staff', token);
    setStaff(Array.isArray(s) ? s : []);
  };

  const handleMetricSelect = (metric) => {
    setSelectedMetric(metric);
    setForm({...form, naacId: metric.id, metricTitle: metric.title, benchmarkArea: metric.area});
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', form, token);
      alert('Task assigned successfully! Staff will be notified.');
      setShow(false);
      setForm({naacId: '', metricTitle: '', benchmarkArea: '', targetValue: '', timeline: '', deadline: '', assignedTo: '', department: '', remarks: ''});
      setSelectedMetric(null);
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const completeTask = async (id) => {
    if (window.confirm('Mark this task as completed? Staff will be notified.')) {
      await api.put('/tasks/' + id + '/complete', {}, token);
      alert('Task completed! Staff has been notified.');
      onUpdate();
    }
  };

  const del = async (id) => {
    if (window.confirm('Delete?')) {
      await api.delete('/tasks/' + id, token);
      onUpdate();
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">NAAC Task Assignment</h3>
        <div className="flex space-x-3">
          <Btn variant="success" icon={Download} onClick={onDownload}>Download</Btn>
          <Btn variant="purple" icon={Plus} onClick={() => setShow(!show)}>{show ? 'Cancel' : 'New Task'}</Btn>
        </div>
      </div>
      
      {show && (
        <form onSubmit={submit} className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-200 shadow-xl">
          <h4 className="text-xl font-bold mb-4 text-purple-600">Select NAAC Metric</h4>
          <div className="grid grid-cols-1 gap-3 mb-4 max-h-60 overflow-y-auto">
            {NAAC_METRICS.map((metric, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleMetricSelect(metric)}
                className={'p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ' + (selectedMetric === metric ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl' : 'bg-white hover:shadow-lg')}
              >
                <div className="flex items-center space-x-3">
                  <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (selectedMetric === metric ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-600')}>{metric.id}</span>
                  <div>
                    <p className="font-bold text-sm">{metric.title}</p>
                    <p className={'text-xs ' + (selectedMetric === metric ? 'text-white/80' : 'text-gray-600')}>{metric.area}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {selectedMetric && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="text" value={form.naacId} readOnly className="px-4 py-3 border-2 border-purple-200 rounded-xl bg-gray-50" />
              <input type="text" value={form.metricTitle} readOnly className="px-4 py-3 border-2 border-purple-200 rounded-xl bg-gray-50" />
              <input type="text" placeholder="Target Value (e.g., 1/year)" value={form.targetValue} onChange={(e) => setForm({...form, targetValue: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              <input type="text" placeholder="Timeline (e.g., 3 months)" value={form.timeline} onChange={(e) => setForm({...form, timeline: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              <input type="date" value={form.deadline} onChange={(e) => setForm({...form, deadline: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              <select value={form.assignedTo} onChange={(e) => setForm({...form, assignedTo: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 bg-white" required>
                <option value="">Select Staff</option>
                {staff.map(s => <option key={s._id} value={s.name}>{s.name} ({s.empId})</option>)}
              </select>
              <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              <textarea placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 col-span-2" rows={2}></textarea>
              <Btn variant="success" type="submit" className="col-span-2 justify-center">Assign Task & Notify Staff</Btn>
            </div>
          )}
        </form>
      )}
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50 animate-bounce"/>
          <p>No tasks assigned yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(t => (
            <div key={t._id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl shadow-lg transform transition-all duration-300 hover:scale-105">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-mono font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-xl shadow-lg">{t.taskId}</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-xl shadow-lg">{t.naacId}</span>
                  </div>
                  <h4 className="text-lg font-bold">{t.metricTitle}</h4>
                  <p className="text-sm text-gray-600">Assigned to: {t.assignedTo}</p>
                  {t.deadline && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                      <Calendar className="w-4 h-4"/>
                      <span>Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
                <span className={'px-3 py-1 rounded-full text-sm font-bold shadow-lg ' + (t.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                  {t.status}
                </span>
              </div>
              <div className="flex space-x-2">
                {t.status !== 'completed' && (
                  <Btn variant="success" icon={CheckCircle} onClick={() => completeTask(t._id)} className="text-sm">
                    Mark Complete
                  </Btn>
                )}
                <Btn variant="primary" icon={MessageCircle} onClick={() => onViewTask(t)} className="text-sm">
                  Messages
                </Btn>
                <button onClick={() => del(t._id)} className="p-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-110">
                  <Trash2 className="w-4 h-4 text-white"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TaskMessagingModal({task, user, token, onClose}) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const loadMessages = async () => {
    const data = await api.get('/tasks/' + task._id + '/messages', token);
    setMessages(Array.isArray(data) ? data : []);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await api.post('/tasks/' + task._id + '/messages', {message: newMsg}, token);
    setNewMsg('');
    loadMessages();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b-2 border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Task Messages</h2>
            <p className="text-sm text-gray-600">{task.taskId} - {task.naacId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-110">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {messages.map(m => {
            const mine = m.senderId._id === user._id;
            return (
              <div key={m._id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-xs px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 ' + (mine ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white border-2 border-purple-100')}>
                  <p className="text-sm font-semibold mb-1">{m.senderId.name}</p>
                  <p className="text-sm">{m.message}</p>
                  <p className={'text-xs mt-1 ' + (mine ? 'text-white/70' : 'text-gray-500')}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={ref}/>
        </div>
        
        <form onSubmit={sendMessage} className="p-4 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex space-x-3">
            <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type message..." className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
            <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-110">
              <Send className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatView({user, token}) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selected) loadMessages();
  }, [selected]);

  useEffect(() => {
    if (ref.current) ref.current.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const loadUsers = async () => {
    const u = await api.get('/chat/users/list', token);
    setUsers(Array.isArray(u) ? u : []);
  };

  const loadMessages = async () => {
    if (!selected) return;
    const m = await api.get('/chat/' + selected._id, token);
    setMessages(Array.isArray(m) ? m : []);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    await api.post('/chat', {receiverId: selected._id, message: newMsg}, token);
    setNewMsg('');
    loadMessages();
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      <Card className="col-span-1 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contacts</h3>
        <div className="space-y-2">
          {users.map(u => (
            <button key={u._id} onClick={() => setSelected(u)} className={'w-full p-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 ' + (selected && selected._id === u._id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl' : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:shadow-lg')}>
              <p className="font-bold">{u.name}</p>
              <p className={'text-xs ' + (selected && selected._id === u._id ? 'text-white/70' : 'text-gray-600')}>{u.email}</p>
            </button>
          ))}
        </div>
      </Card>
      
      <Card className="col-span-2 flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50 animate-bounce"/>
              <p>Select a contact to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="pb-4 border-b-2 border-purple-100 mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{selected.name}</h3>
              <p className="text-sm text-gray-600">{selected.email}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map(m => {
                const mine = m.senderId._id === user._id;
                return (
                  <div key={m._id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                    <div className={'max-w-xs px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 ' + (mine ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-gray-100 to-gray-200')}>
                      <p className="text-sm">{m.message}</p>
                      <p className={'text-xs mt-1 ' + (mine ? 'text-white/70' : 'text-gray-500')}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={ref}/>
            </div>
            
            <form onSubmit={sendMessage} className="flex space-x-3">
              <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type message..." className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-110">
                <Send className="w-5 h-5"/>
              </button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

function ReportModal({report, onClose, onUpdate}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b-2 border-purple-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Report Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-110">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Faculty Name</p>
              <p className="font-bold">{report.facultyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-bold">{report.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Special Lecture</p>
              <p className="font-bold">{report.specialLecture}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expert Speaker</p>
              <p className="font-bold">{report.expertSpeaker}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-bold">{report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Participant Count</p>
              <p className="font-bold">{report.participantCount}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Summary Points</p>
            <p className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">{report.summaryPoints}</p>
          </div>
          
          {report.geotaggedPhotos && report.geotaggedPhotos.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Photos</p>
              <div className="grid grid-cols-3 gap-4">
                {report.geotaggedPhotos.map((photo, i) => (
                  <img key={i} src={'http://localhost:5001' + photo.photoUrl} className="w-full h-40 object-cover rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-110" alt="Event" />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Btn variant="success" icon={CheckCircle} onClick={() => onUpdate(report._id, 'approved')}>Approve</Btn>
            <Btn variant="danger" icon={XCircle} onClick={() => onUpdate(report._id, 'rejected')}>Reject</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffPortal({user, token, onLogout}) {
  const [tab, setTab] = useState('mytasks');
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const t = await api.get('/tasks', token);
      const r = await api.get('/reports', token);
      const s = await api.get('/stats', token);
      setTasks(Array.isArray(t) ? t : []);
      setReports(Array.isArray(r) ? r : []);
      setStats(s || {});
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    {id: 'mytasks', label: 'My Tasks', icon: Target},
    {id: 'myreports', label: 'My Reports', icon: CheckSquare},
    {id: 'submit', label: 'Submit Report', icon: Upload},
    {id: 'chat', label: 'Chat', icon: MessageSquare}
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      
      <div className={(menuOpen ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0 fixed lg:relative w-80 h-full bg-white/10 backdrop-blur-xl border-r border-white/20 transition-all duration-300 z-40 overflow-y-auto'}>
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
              <Building2 className="w-8 h-8 text-purple-600"/>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">PMIST</h2>
              <p className="text-white/60 text-sm">Staff Portal</p>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">{user.name ? user.name.charAt(0) : 'S'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{user.name}</p>
                <p className="text-white/60 text-xs truncate">{user.empId}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-white/60 text-xs">My Tasks</p>
              <p className="text-2xl font-bold text-white">{stats.myTasks || 0}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-white/60 text-xs">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completedTasks || 0}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => {setTab(item.id); setMenuOpen(false);}} className={'w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ' + (tab === item.id ? 'bg-white text-purple-600 shadow-2xl' : 'text-white/60 hover:text-white hover:bg-white/5')}>
              <item.icon className="w-6 h-6"/>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <Btn variant="danger" icon={LogOut} onClick={onLogout} className="w-full justify-center">Logout</Btn>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        <header className="bg-white border-b-4 border-purple-200 px-8 py-6 sticky top-0 z-10 shadow-xl">
          <h1 className="text-4xl font-black capitalize bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{tab === 'mytasks' ? 'My Tasks' : tab === 'myreports' ? 'My Reports' : tab === 'submit' ? 'Submit Report' : 'Chat'}</h1>
          <p className="text-gray-600 mt-1">Welcome {user.name}</p>
        </header>

        <div className="p-8">
          {tab === 'mytasks' && <MyTasksView tasks={tasks} onViewTask={setSelectedTask} />}
          {tab === 'myreports' && <MyReportsView reports={reports} />}
          {tab === 'submit' && <SubmitReportView token={token} onSubmit={loadData} />}
          {tab === 'chat' && <ChatView user={user} token={token} />}
        </div>
      </div>

      {selectedTask && <TaskMessagingModal task={selectedTask} user={user} token={token} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function MyTasksView({tasks, onViewTask}) {
  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">My Assigned Tasks</h3>
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-16 h-16 mx-auto mb-4 opacity-50 animate-bounce"/>
          <p>No tasks assigned yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(t => (
            <div key={t._id} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl border-2 border-purple-200 shadow-lg transform transition-all duration-300 hover:scale-105">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono font-bold text-purple-600 bg-white px-3 py-1 rounded-xl shadow-lg">{t.taskId}</span>
                    <span className="text-sm font-bold text-blue-600 bg-white px-3 py-1 rounded-xl shadow-lg">{t.naacId}</span>
                  </div>
                  <h4 className="text-xl font-bold text-purple-900">{t.metricTitle}</h4>
                  {t.deadline && (
                    <p className="text-sm text-red-600 flex items-center space-x-1 mt-2 font-semibold">
                      <Calendar className="w-4 h-4"/>
                      <span>Deadline: {new Date(t.deadline).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
                <span className={'px-4 py-2 rounded-full text-sm font-bold shadow-lg ' + (t.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                  {t.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                {t.targetValue && (
                  <div className="p-3 bg-white rounded-xl">
                    <p className="text-gray-600">Target Value</p>
                    <p className="font-semibold text-purple-900">{t.targetValue}</p>
                  </div>
                )}
                {t.timeline && (
                  <div className="p-3 bg-white rounded-xl">
                    <p className="text-gray-600">Timeline</p>
                    <p className="font-semibold text-purple-900">{t.timeline}</p>
                  </div>
                )}
              </div>
              
              {t.remarks && (
                <div className="p-3 bg-white rounded-xl mb-4 border-2 border-purple-200">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">Remarks from Admin:</p>
                  <p className="text-sm text-purple-900">{t.remarks}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Btn variant="purple" icon={MessageCircle} onClick={() => onViewTask(t)}>
                  Send Message to Admin
                </Btn>
                {t.status === 'completed' && (
                  <div className="px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-semibold flex items-center space-x-2 shadow-lg">
                    <CheckCircle className="w-5 h-5"/>
                    <span>Completed by Admin</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MyReportsView({reports}) {
  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Submitted Reports</h3>
      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse"/>
          <p>No reports submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r._id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl flex justify-between items-center shadow-lg transform transition-all duration-300 hover:scale-105">
              <div>
                <h4 className="font-bold text-lg text-purple-900">{r.specialLecture}</h4>
                <p className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={'px-4 py-2 rounded-full text-sm font-bold shadow-lg ' + (r.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' : r.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white')}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SubmitReportView({token, onSubmit}) {
  const [form, setForm] = useState({
    facultyName: '',
    department: '',
    specialLecture: '',
    expertSpeaker: '',
    designation: '',
    institution: '',
    mobile: '',
    beneficiaries: '',
    date: '',
    time: '',
    summaryPoints: '',
    participantCount: ''
  });
  const [photos, setPhotos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('reportData', JSON.stringify(form));
      photos.forEach(p => fd.append('geotaggedPhotos', p));
      attachments.forEach(a => fd.append('attachments', a));
      
      await api.upload('/reports', fd, token);
      alert('Report submitted successfully!');
      setForm({facultyName: '', department: '', specialLecture: '', expertSpeaker: '', designation: '', institution: '', mobile: '', beneficiaries: '', date: '', time: '', summaryPoints: '', participantCount: ''});
      setPhotos([]);
      setAttachments([]);
      onSubmit();
    } catch (e) {
      alert('Error submitting report');
    }
    setLoading(false);
  };

  return (
    <Card>
      <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Submit New Report</h3>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Faculty Name" value={form.facultyName} onChange={(e) => setForm({...form, facultyName: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
          <input type="text" placeholder="Department" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
          <input type="text" placeholder="Special Lecture" value={form.specialLecture} onChange={(e) => setForm({...form, specialLecture: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
          <input type="text" placeholder="Expert Speaker" value={form.expertSpeaker} onChange={(e) => setForm({...form, expertSpeaker: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          <input type="date" placeholder="Date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
          <input type="time" placeholder="Time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          <input type="number" placeholder="Participant Count" value={form.participantCount} onChange={(e) => setForm({...form, participantCount: e.target.value})} className="px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
        </div>
        
        <textarea placeholder="Summary Points" value={form.summaryPoints} onChange={(e) => setForm({...form, summaryPoints: e.target.value})} className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all" rows={4} required></textarea>
        
        <div>
          <label className="block text-sm font-bold mb-2 text-purple-900">Geotagged Photos</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files))} className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl bg-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-2 text-purple-900">Attachments</label>
          <input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files))} className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl bg-white" />
        </div>
        
        <Btn variant="success" type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Submitting...' : 'Submit Report'}
        </Btn>
      </form>
    </Card>
  );
}