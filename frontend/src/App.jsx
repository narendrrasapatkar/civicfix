import React, { useState, useEffect, useRef } from 'react';
import API from './api';
import { 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  LogOut, 
  MapPin, 
  Send,
  BarChart3,
  UploadCloud,
  FileVideo,
  Image as ImageIcon,
  X,
  Layers,
  Shield,
  Activity,
  UserCheck,
  RefreshCw,
  FolderKanban
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('citizen');
  const [authError, setAuthError] = useState('');

  // Complaint Filing Inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // Media Upload State
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
  const [uploadedMediaType, setUploadedMediaType] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // App Data
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data);
    } catch {
      handleLogout();
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const deptRes = await API.get('/departments');
        setDepartments(deptRes.data);
      } catch (err) {
        console.warn('Departments optional load failed:', err);
      }

      if (user?.role === 'admin') {
        const [compRes, anaRes] = await Promise.all([
          API.get('/admin/complaints'),
          API.get('/admin/analytics')
        ]);
        setComplaints(compRes.data);
        setAnalytics(anaRes.data);
      } else {
        const compRes = await API.get('/complaints/my');
        setComplaints(compRes.data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedMediaUrl(res.data.file_url);
      setUploadedMediaType(res.data.media_type);
    } catch {
      alert('Upload failed. Check server console or try an image under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const res = await API.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      setToken(res.data.access_token);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Invalid email or password');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await API.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        role
      });
      setIsLoginView(true);
      alert('Registration successful! Please sign in with your credentials.');
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setComplaints([]);
    setAnalytics(null);
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/complaints', {
        title,
        description,
        category,
        location,
        priority,
        image_url: uploadedMediaUrl || null
      });

      // Clear input fields
      setTitle('');
      setDescription('');
      setLocation('');
      setUploadedMediaUrl('');
      setUploadedMediaType('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Immediately prepend without full page reload
      setComplaints((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error('Submission failed:', err);
      alert(err.response?.data?.detail || 'Failed to submit complaint.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await API.patch(`/admin/complaints/${id}/status`, { status: newStatus });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: res.data.status } : c))
      );
    } catch {
      alert('Could not update status');
    }
  };

  const handleResolveComplaint = async (id) => {
    const notes = prompt('Enter official resolution summary:');
    if (!notes) return;
    try {
      const res = await API.post(`/admin/complaints/${id}/resolve`, {
        notes,
        resolution_image_url: null
      });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: res.data.status, resolution: res.data.resolution } : c))
      );
    } catch {
      alert('Could not resolve ticket');
    }
  };

  // ---------------------------------------------------------------------------
  // AUTH SCREEN (Clean Crisp Slate Card)
  // ---------------------------------------------------------------------------
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 selection:bg-teal-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                CivicFix <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">Portal</span>
              </h1>
              <p className="text-slate-400 text-xs">Municipal Redressal & Infrastructure Engine</p>
            </div>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {isLoginView ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-teal-500/25 active:scale-[0.99]"
              >
                Sign In to Portal
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-teal-400 transition"
                >
                  <option value="citizen">Citizen (File Grievances)</option>
                  <option value="admin">Municipal Authority (Admin Desk)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 active:scale-[0.99]"
              >
                Create Account
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-slate-700/60 pt-4">
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError('');
              }}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium transition"
            >
              {isLoginView ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD MAIN VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 py-3.5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">CivicFix</span>
            <span className="text-[11px] text-slate-400 ml-2 font-mono">Operations</span>
          </div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
            user.role === 'admin' 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
              : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
          }`}>
            {user.role}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{user.full_name}</div>
            <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Admin KPI Overview Cards */}
        {user.role === 'admin' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-850 bg-slate-800/50 border border-slate-700/80 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
                <span>Total Registered</span>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-extrabold mt-2 text-white">{analytics.summary.total_complaints}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/80 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-amber-400 text-xs font-medium">
                <span>Pending Verification</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold mt-2 text-amber-300">{analytics.summary.pending}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/80 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-cyan-400 text-xs font-medium">
                <span>Work In Progress</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold mt-2 text-cyan-300">{analytics.summary.in_progress}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/80 p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-emerald-400 text-xs font-medium">
                <span>Resolved & Closed</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold mt-2 text-emerald-300">{analytics.summary.resolved}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Left Side (Citizen Only) */}
          {user.role === 'citizen' && (
            <div className="lg:col-span-5 bg-slate-800/40 border border-slate-700/80 p-6 rounded-2xl h-fit shadow-md">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Submit New Grievance</h2>
              </div>

              <form onSubmit={handleCreateComplaint} className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Issue Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Major sewer leakage outside park"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition"
                    >
                      <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                      <option value="Sanitation & Waste">Sanitation & Waste</option>
                      <option value="Electrical & Lighting">Electrical & Lighting</option>
                      <option value="Water Supply & Drainage">Water Supply & Drainage</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Exact Location / Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="Sector, street corner, landmark"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Specific facts, hazards, duration of issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 transition"
                  />
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Visual Evidence</label>
                  <div className="mt-1.5">
                    {!uploadedMediaUrl ? (
                      <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-teal-500/50 bg-slate-900/50 rounded-xl cursor-pointer transition group">
                        <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition mb-1" />
                        <span className="text-xs text-slate-300 font-medium">
                          {uploading ? 'Processing file...' : 'Attach Image or Video'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WEBP, MP4, MOV</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {uploadedMediaType === 'video' ? (
                            <FileVideo className="w-4 h-4 text-teal-400" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="text-xs text-slate-200 truncate max-w-[200px]">
                            Attached ({uploadedMediaType})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedMediaUrl('');
                            setUploadedMediaType('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-teal-500/20 active:scale-[0.99]"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch Report
                </button>
              </form>
            </div>
          )}

          {/* Incident Feed Column */}
          <div className={user.role === 'citizen' ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-teal-400" />
                {user.role === 'admin' ? 'City-Wide Grievance Queue' : 'My Filed Reports'}
              </h2>
              <button
                onClick={loadData}
                className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {loading && complaints.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-12">Querying database...</div>
            ) : complaints.length === 0 ? (
              <div className="border border-dashed border-slate-700/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No incidents reported in this scope.
              </div>
            ) : (
              <div className="space-y-3.5">
                {complaints.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 border border-slate-700/80 p-5 rounded-2xl hover:border-slate-600/80 transition shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono bg-slate-900 border border-slate-700 text-teal-300 px-2 py-0.5 rounded-md">
                            {item.ticket_id}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                            item.priority === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            item.priority === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-700/50 text-slate-300'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mt-2">{item.title}</h3>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        item.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        item.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{item.description}</p>

                    {/* Media Display Preview */}
                    {item.image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/80 max-h-60 bg-black/40 flex items-center justify-center">
                        {item.image_url.endsWith('.mp4') || item.image_url.endsWith('.mov') || item.image_url.endsWith('.webm') ? (
                          <video src={item.image_url} controls className="max-h-60 w-full object-contain" />
                        ) : (<img 
  src={
    item.image_url?.startsWith('http')
      ? item.image_url
      : `https://civicfix-t3mx.onrender.com${item.image_url?.startsWith('/') ? '' : '/'}${item.image_url}`
  } 
  alt="Evidence" 
  className="max-h-60 w-full object-cover" 
/>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-4 border-t border-slate-700/60 pt-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {item.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {item.category}
                      </div>
                      <div>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Resolution Card */}
                    {item.resolution && (
                      <div className="mt-3 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl text-xs">
                        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Official Resolution Record
                        </div>
                        <p className="text-emerald-100 mt-1">{item.resolution.notes}</p>
                        <div className="text-emerald-400/80 text-[10px] mt-1 font-mono">
                          Certified by {item.resolution.resolved_by} • {new Date(item.resolution.resolved_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {user.role === 'admin' && item.status !== 'Resolved' && (
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/60">
                        {item.status === 'Submitted' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'In Progress')}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveComplaint(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Resolve Grievance
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}