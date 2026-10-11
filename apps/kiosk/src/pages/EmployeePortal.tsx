import { useState, useEffect } from 'react';
import { UserCircle, Clock, LogOut, CheckSquare, Wrench, Play, CheckCircle2, Package, Pause, RefreshCw, Zap, Plus, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function EmployeePortal() {
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [loggedInEmp, setLoggedInEmp] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [punches, setPunches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [inventoryParts, setInventoryParts] = useState<any[]>([]);
  const [workTimeline, setWorkTimeline] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'jobcards' | 'attendance' | 'tasks'>('jobcards');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [partSource, setPartSource] = useState<'inventory' | 'vendor'>('inventory');
  const [partQty, setPartQty] = useState(1);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [loading, setLoading] = useState(false);

  // Vendor Purchase Requisition State
  const [vendorPart, setVendorPart] = useState({
    partName: '',
    vendorName: '',
    vendorInvoiceNumber: '',
    purchaseCost: 0,
    unitPrice: 0,
    quantity: 1,
  });

  // Task pause modal state
  const [selectedTaskToPause, setSelectedTaskToPause] = useState<any>(null);
  const [taskPauseReason, setTaskPauseReason] = useState<string>('WAITING_FOR_PARTS');
  const [taskPauseNote, setTaskPauseNote] = useState<string>('');

  // Inter-Department Handover QWC Checklist State
  const [showQwcModal, setShowQwcModal] = useState(false);
  const [qwcData, setQwcData] = useState<{
    fromSection: string;
    toSection: string;
    fromLaborId?: string;
    toLaborId?: string;
    notes: string;
  }>({
    fromSection: '',
    toSection: '',
    notes: '',
  });

  const [qwcChecklist, setQwcChecklist] = useState([
    { item: 'No new vehicle body scratches or paint damage created', passed: true },
    { item: 'All tools & working materials cleared from vehicle', passed: true },
    { item: 'Vehicle dashboard & electrical warning lights checked', passed: true },
    { item: 'Interior & seat cleanliness maintained', passed: true },
  ]);

  useEffect(() => {
    document.title = "Fazah - portal";
  }, []);

  const PAUSE_REASONS = [
    { id: 'WAITING_FOR_PARTS', label: '⚙️ Waiting for Parts', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'WAITING_FOR_APPROVAL', label: '⏳ Waiting for Customer Approval', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { id: 'LUNCH_BREAK', label: '🍱 Lunch / Tea Break', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: 'SHIFT_END', label: '🔧 Shift End / Handover', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/kiosk/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode, pin })
      });
      if (!res.ok) throw new Error('Invalid code or PIN');
      const data = await res.json();
      setLoggedInEmp(data.employee);
      fetchEmpData(data.employee.id);
    } catch (err) {
      setLoginError('Login failed. Check your code and PIN.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpData = async (empId: string) => {
    try {
      const resPunches = await fetch(`/api/kiosk/staff-punches/${empId}`);
      if (resPunches.ok) setPunches(await resPunches.json());

      const resTasks = await fetch(`/api/kiosk/staff-tasks/${empId}`);
      if (resTasks.ok) setTasks(await resTasks.json());

      const resJobs = await fetch(`/api/job-cards/mechanic/${empId}`);
      if (resJobs.ok) setJobCards(await resJobs.json());

      const resParts = await fetch(`/api/job-cards/inventory-parts`);
      if (resParts.ok) setInventoryParts(await resParts.json());

      const resTimeline = await fetch(`/api/kiosk/staff-work-timeline/${empId}`);
      if (resTimeline.ok) setWorkTimeline(await resTimeline.json());
    } catch (e) {
      console.error(e);
    }
  };

  const updateJobStatus = async (jobId: string, status: string, pauseReason?: string) => {
    try {
      await fetch(`/api/job-cards/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          pauseReason: pauseReason || null,
          employeeId: loggedInEmp.id
        })
      });
      if (loggedInEmp) fetchEmpData(loggedInEmp.id);
      if (selectedJob && selectedJob.id === jobId) {
        fetchSingleJob(jobId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, pauseReason?: string, note?: string) => {
    try {
      await fetch(`/api/kiosk/staff-tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          pauseReason: pauseReason || null,
          note: note || null,
          employeeId: loggedInEmp?.id
        })
      });
      if (loggedInEmp) fetchEmpData(loggedInEmp.id);
      setSelectedTaskToPause(null);
    } catch (e) {
      console.error(e);
    }
  };

  const updateLaborTaskStatus = async (laborId: string, status: string, pauseReason?: string) => {
    try {
      await fetch(`/api/job-cards/labors/${laborId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          pauseReason: pauseReason || null,
          employeeId: loggedInEmp?.id
        })
      });
      if (selectedJob) fetchSingleJob(selectedJob.id);
      if (loggedInEmp) fetchEmpData(loggedInEmp.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQwcSubmit = async () => {
    if (!selectedJob) return;
    try {
      await fetch(`/api/job-cards/${selectedJob.id}/handover-qwc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...qwcData,
          handedOverById: loggedInEmp?.id,
          checklist: qwcChecklist
        })
      });
      setShowQwcModal(false);
      fetchSingleJob(selectedJob.id);
      if (loggedInEmp) fetchEmpData(loggedInEmp.id);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSingleJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/job-cards/${jobId}`);
      if (res.ok) setSelectedJob(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPartToJob = async () => {
    if (!selectedJob) return;

    let partPayload: any = {};
    if (partSource === 'inventory') {
      if (!selectedPartId) return;
      const part = inventoryParts.find(p => p.id === selectedPartId);
      if (!part) return;
      partPayload = {
        partNumber: part.partNumber,
        partName: part.name,
        quantity: partQty,
        unitPrice: part.unitPrice,
        requestedById: loggedInEmp.id,
        status: 'ISSUED',
        isVendorPurchase: false
      };
    } else {
      // Vendor Purchase Requisition
      if (!vendorPart.partName) return;
      partPayload = {
        partNumber: 'VENDOR',
        partName: vendorPart.partName,
        quantity: vendorPart.quantity || 1,
        unitPrice: vendorPart.unitPrice || 0,
        isVendorPurchase: true,
        vendorName: vendorPart.vendorName,
        vendorInvoiceNumber: vendorPart.vendorInvoiceNumber,
        purchaseCost: vendorPart.purchaseCost || 0,
        requestedById: loggedInEmp.id,
        status: 'ISSUED'
      };
    }

    try {
      await fetch(`/api/job-cards/${selectedJob.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partPayload)
      });
      setShowPartModal(false);
      setVendorPart({ partName: '', vendorName: '', vendorInvoiceNumber: '', purchaseCost: 0, unitPrice: 0, quantity: 1 });
      fetchSingleJob(selectedJob.id);
      if (loggedInEmp) fetchEmpData(loggedInEmp.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setLoggedInEmp(null);
    setEmployeeCode('');
    setPin('');
    setSelectedJob(null);
    setWorkTimeline(null);
  };

  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const isLate = (timestamp: string) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    return hour > 9 || (hour === 9 && minute > 10);
  };

  // LOGIN SCREEN MATCHING ADMIN THEME
  if (!loggedInEmp) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl w-full max-w-md flex flex-col items-center">
          <img src="/logo.png" alt="FAZAH AUTO GARAGE" className="w-24 h-24 object-contain mb-4" />
          <h2 className="text-2xl font-black text-slate-900 text-center">
            FAZAH <span className="text-lime-600">STAFF</span> <span className="text-blue-600">PORTAL</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 mb-6 text-center">Enter your Staff Code & PIN to access workshop tasks & log time</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee Code</label>
              <input 
                type="text" 
                value={employeeCode}
                onChange={e => setEmployeeCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center text-lg rounded-xl p-3 focus:outline-none focus:border-blue-500 uppercase tracking-widest font-bold"
                required
                placeholder="e.g. MCH01"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">6-Digit Secret PIN</label>
              <input 
                type="password" 
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center text-xl rounded-xl p-3 focus:outline-none focus:border-blue-500 tracking-widest"
                required
                placeholder="••••••"
              />
            </div>
            {loginError && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 text-center font-bold">{loginError}</div>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-md transition-transform active:scale-95 text-base flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <UserCircle size={20} />}
              Log In to Staff Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const liveState = workTimeline?.liveStatus;
  const stats = workTimeline?.stats;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* HEADER MATCHING ADMIN THEME */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="FAZAH Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-xl font-black tracking-wide text-slate-900 leading-tight">
              FAZAH <span className="text-lime-600">AUTO</span> <span className="text-blue-600">STAFF</span>
            </h1>
            <span className="text-xs text-slate-500 font-semibold">{loggedInEmp.fullName} ({loggedInEmp.employeeCode}) • {loggedInEmp.jobTitle || 'Technician'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchEmpData(loggedInEmp.id)}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <LogOut size={16} /> Exit
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* LIVE WORK STATUS & TODAY'S TIMELINE REPORT SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">My Live Work Tracking Report</span>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border tracking-wide flex items-center gap-2 shadow-sm ${
                  liveState?.state === 'WORKING' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  liveState?.state === 'PAUSED' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  liveState?.state === 'FREE' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  <Zap size={14} /> {liveState?.label || 'Clocked Out'}
                </span>
                {liveState?.durationMinutes !== undefined && (
                  <span className="text-xs text-slate-700 font-mono font-bold">
                    Elapsed: {formatMinutes(liveState.durationMinutes)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Shift Time</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatMinutes(stats?.shiftMinutes || 0)}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Active Work</span>
                <span className="text-base font-black text-emerald-800 font-mono">{formatMinutes(stats?.activeTaskMinutes || 0)}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] text-amber-700 font-bold uppercase block">Paused Time</span>
                <span className="text-base font-black text-amber-800 font-mono">{formatMinutes(stats?.pausedMinutes || 0)}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
                <span className="text-[10px] text-blue-700 font-bold uppercase block">Free / Idle</span>
                <span className="text-base font-black text-blue-800 font-mono">{formatMinutes(stats?.freeMinutes || 0)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Timeline Segments Preview */}
          {workTimeline?.segments && workTimeline.segments.length > 0 && (
            <div className="mt-4 pt-2">
              <span className="text-xs font-bold text-slate-500 block mb-2">Today's Timeline Log Segments:</span>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {workTimeline.segments.map((seg: any) => (
                  <span 
                    key={seg.id}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      seg.status === 'IN_PROGRESS' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : seg.status === 'PAUSED'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : seg.status === 'FREE'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{seg.title}</span>
                    <span className="font-mono text-[10px] opacity-80">({formatMinutes(seg.durationMinutes)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'jobcards', label: 'Assigned Job Cards', icon: Wrench, count: jobCards.length },
            { id: 'tasks', label: 'Shop Tasks', icon: CheckSquare, count: tasks.length },
            { id: 'attendance', label: 'Attendance History', icon: Clock, count: punches.length },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedJob(null); }}
                className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon size={18} /> {tab.label} <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MECHANIC JOB CARDS */}
        {activeTab === 'jobcards' && (
          <div className="space-y-4">
            {!selectedJob ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobCards.length === 0 ? (
                  <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                    <CheckCircle2 size={48} className="mx-auto text-lime-600 mb-3 opacity-60" />
                    <h4 className="text-xl font-bold text-slate-900">No Assigned Job Cards</h4>
                    <p className="text-xs text-slate-500 mt-1">You currently have no repair jobs assigned to your queue.</p>
                  </div>
                ) : jobCards.map(job => (
                  <div key={job.id} className="bg-slate-50 border border-slate-200 hover:border-blue-400 p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-blue-600 font-black text-sm">{job.jobNumber}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          job.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                          job.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          job.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-900">{job.vehicleMake} {job.vehicleModel}</h4>
                      <p className="text-xs text-lime-700 font-mono font-bold mt-0.5">Plate #: {job.vehiclePlateNumber}</p>
                      
                      {job.pauseReason && (
                        <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-xl">
                          <strong>Pause Reason:</strong> {job.pauseReason}
                        </div>
                      )}

                      {job.complaints && job.complaints.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.complaints.map((c: string, idx: number) => (
                            <span key={idx} className="bg-white text-slate-700 text-[11px] px-2.5 py-1 rounded-lg border border-slate-200">
                              🔧 {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      {job.status === 'IN_PROGRESS' ? (
                        <>
                          <button onClick={() => updateJobStatus(job.id, 'PAUSED', 'WAITING_FOR_PARTS')} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                            <Pause size={14} /> Pause Job
                          </button>
                          <button onClick={() => updateJobStatus(job.id, 'COMPLETED')} className="flex-1 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                            <CheckCircle2 size={14} /> Complete
                          </button>
                        </>
                      ) : (
                        <button onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                          <Play size={14} /> Start Working
                        </button>
                      )}
                      
                      <button onClick={() => { fetchSingleJob(job.id); }} className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300">
                        View Details ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* SELECTED JOB DETAILS VIEW */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <button onClick={() => setSelectedJob(null)} className="text-xs font-bold text-blue-600 hover:underline mb-1 block">← Back to Job Queue</button>
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      {selectedJob.jobNumber} • {selectedJob.vehicleMake} {selectedJob.vehicleModel}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Customer: {selectedJob.customerName} ({selectedJob.customerPhone})</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                      selectedJob.status === 'IN_PROGRESS' ? 'bg-lime-100 text-lime-800 border border-lime-300' :
                      selectedJob.status === 'PAUSED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>

                {/* Status Action Buttons & Pause Reason Selector */}
                {selectedJob.status === 'COMPLETED' ? (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between font-bold shadow-xs">
                    <span className="flex items-center gap-2">
                      🔒 Job Card Completed & Finalized (Only Admin Can Reopen)
                    </span>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-[11px] font-mono font-bold uppercase">LOCKED</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold uppercase text-slate-700 block">Update Job Progress Status</span>
                    
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateJobStatus(selectedJob.id, 'IN_PROGRESS')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${selectedJob.status === 'IN_PROGRESS' ? 'bg-lime-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>
                        <Play size={14} /> Start / Resume Work
                      </button>
                      <button onClick={() => updateJobStatus(selectedJob.id, 'COMPLETED')} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${selectedJob.status === 'COMPLETED' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    </div>

                    {/* Pause Reasons 1-Tap Picker */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 block mb-2">Or Pause with Reason:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PAUSE_REASONS.map(r => (
                          <button key={r.id} onClick={() => updateJobStatus(selectedJob.id, 'PAUSED', r.id)} className={`p-2 rounded-xl text-xs font-bold border transition-all text-left ${r.color}`}>
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ERP TRACKING BADGE */}
                {selectedJob.isSyncedFromErp && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between text-xs text-indigo-900">
                    <span className="font-bold flex items-center gap-2">
                      <RefreshCw size={14} className="text-indigo-600 animate-spin" /> Synced from External ERP Ref #{selectedJob.externalErpId || selectedJob.jobNumber}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-mono font-bold rounded-lg text-[10px]">ERP TRACKING ACTIVE</span>
                  </div>
                )}

                {/* MULTI-DEPARTMENT SEQUENTIAL TASKS & HANDOVER QWC */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Wrench size={18} className="text-blue-600" /> Multi-Department Tasks & Inter-Department Handover (QWC)
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">Verify vehicle condition before handover to next section</span>
                  </div>

                  {(!selectedJob.labors || selectedJob.labors.length === 0) ? (
                    <div className="bg-slate-50 p-4 text-center text-xs text-slate-500 rounded-2xl border border-slate-200">
                      No specific department labor operations defined.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedJob.labors.map((labor: any, idx: number) => {
                        const isNextInLine = idx > 0 && selectedJob.labors[idx - 1]?.status === 'COMPLETED' && labor.status === 'PENDING';
                        return (
                          <div key={labor.id} className={`p-4 rounded-2xl border transition-all ${
                            labor.status === 'IN_PROGRESS' ? 'bg-emerald-50 border-emerald-300 shadow-sm' :
                            labor.status === 'QA_PENDING' ? 'bg-purple-50 border-purple-300' :
                            labor.status === 'HANDOVER_PENDING' || isNextInLine ? 'bg-amber-50 border-amber-300' :
                            labor.status === 'COMPLETED' ? 'bg-blue-50 border-blue-200' :
                            'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                                  {labor.stepOrder || idx + 1}
                                </span>
                                <span className="font-black text-slate-900 text-sm">{labor.operationName}</span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                                  {labor.section}
                                </span>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                labor.status === 'IN_PROGRESS' ? 'bg-emerald-600 text-white' :
                                labor.status === 'PAUSED' ? 'bg-amber-600 text-white' :
                                labor.status === 'QA_PENDING' ? 'bg-purple-600 text-white' :
                                labor.status === 'HANDOVER_PENDING' ? 'bg-amber-500 text-white' :
                                labor.status === 'COMPLETED' ? 'bg-blue-600 text-white' :
                                'bg-slate-300 text-slate-700'
                              }`}>
                                {labor.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2 mt-2 gap-2">
                              <span>Assigned Tech: <strong>{labor.assignedMechanic?.fullName || 'Unassigned'}</strong></span>
                              <span>Est: {labor.estimatedHours}h • Logged: {labor.actualMinutes || 0} mins</span>
                            </div>

                            {/* TASK ACTION BUTTONS */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {labor.status !== 'COMPLETED' && (
                                <>
                                  {labor.status === 'IN_PROGRESS' ? (
                                    <>
                                      <button onClick={() => updateLaborTaskStatus(labor.id, 'PAUSED', 'WAITING_FOR_PARTS')} className="py-2 px-3 bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                                        <Pause size={12} /> Pause Task
                                      </button>
                                      <button onClick={() => updateLaborTaskStatus(labor.id, 'QA_PENDING')} className="py-2 px-3 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Complete & Send for QA
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => updateLaborTaskStatus(labor.id, 'IN_PROGRESS')} className="py-2 px-3 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1">
                                      <Play size={12} /> Start Task #{labor.stepOrder}
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Inter-Department Handover QWC Button */}
                              {idx < selectedJob.labors.length - 1 && labor.status === 'COMPLETED' && (
                                <button
                                  onClick={() => {
                                    const nextLabor = selectedJob.labors[idx + 1];
                                    setQwcData({
                                      fromSection: labor.section,
                                      toSection: nextLabor.section,
                                      fromLaborId: labor.id,
                                      toLaborId: nextLabor.id,
                                      notes: `QWC verification completed from ${labor.section} to ${nextLabor.section}`,
                                    });
                                    setShowQwcModal(true);
                                  }}
                                  className="py-2 px-3 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
                                >
                                  <ShieldCheck size={14} /> Perform QWC Handover ➔ {selectedJob.labors[idx + 1]?.section}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PAST HANDOVER QWC LOGS */}
                {selectedJob.handovers && selectedJob.handovers.length > 0 && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h5 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-lime-600" /> Verified Inter-Department Handovers (QWC Log)
                    </h5>
                    <div className="space-y-1.5">
                      {selectedJob.handovers.map((h: any) => (
                        <div key={h.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900">[{h.fromSection}] ➔ [{h.toSection}]</span>
                            <span className="text-slate-500 block text-[11px] mt-0.5">{h.notes}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-lime-100 text-lime-800 font-bold rounded-lg text-[10px]">QWC VERIFIED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Parts & Requisition */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Package size={18} className="text-lime-600" /> Issued Spare Parts & Vendor Purchases
                    </h4>
                    <button onClick={() => setShowPartModal(true)} className="px-3.5 py-2 bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
                      <Plus size={14} /> Add / Purchase Part
                    </button>
                  </div>

                  {(!selectedJob.parts || selectedJob.parts.length === 0) ? (
                    <div className="bg-slate-50 p-6 text-center text-xs text-slate-500 rounded-2xl border border-slate-200">
                      No parts issued yet for this job. Tap 'Add / Purchase Part' above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedJob.parts.map((p: any) => (
                        <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{p.partName}</span>
                              {p.isVendorPurchase && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                                  <ShoppingBag size={10} /> Vendor
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-mono block mt-0.5">
                              {p.isVendorPurchase 
                                ? `Vendor: ${p.vendorName || 'Outside Vendor'} (Bill #${p.vendorInvoiceNumber || 'N/A'})` 
                                : `PN: ${p.partNumber} • Qty: ${p.quantity}`}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-lime-700">{p.totalPrice} AED</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHOP FLOOR TASKS WITH TIME LOGGING */}
        {activeTab === 'tasks' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <CheckSquare className="text-lime-600" /> Assigned Shop Floor Tasks
              </h3>
              <span className="text-xs text-slate-500 font-medium">Track time when starting, pausing, or completing tasks</span>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No general shop tasks assigned to you right now.</p>
              ) : tasks.map(task => (
                <div key={task.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        task.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        task.status === 'paused' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        task.status === 'completed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {task.status}
                      </span>
                      {task.startedAt && (
                        <span className="text-xs text-slate-500 font-mono">
                          Started: {new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{task.title}</h4>
                    {task.description && <p className="text-xs text-slate-600 mt-1">{task.description}</p>}
                    {task.pauseReason && (
                      <p className="text-xs text-amber-800 mt-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 inline-block">
                        ⚠️ Pause Reason: {task.pauseReason}
                      </p>
                    )}
                  </div>

                  {/* Task Action Controls */}
                  <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                    {task.status === 'pending' && (
                      <button 
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Play size={14} /> Start Task
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <>
                        <button 
                          onClick={() => setSelectedTaskToPause(task)}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Pause size={14} /> Pause Task
                        </button>
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Complete Task
                        </button>
                      </>
                    )}

                    {task.status === 'paused' && (
                      <>
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play size={14} /> Resume Task
                        </button>
                        <button 
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Complete Task
                        </button>
                      </>
                    )}

                    {task.status === 'completed' && (
                      <span className="text-xs text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                        <CheckCircle2 size={14} /> Finished
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="text-lime-600" /> My Attendance & Clock Punch Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Punch Type</th>
                    <th className="py-3 px-2">Time</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {punches.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">No attendance records found.</td></tr>
                  ) : punches.map(p => {
                    const pDate = new Date(p.serverTs);
                    const punchIsLate = p.type === 'IN' && isLate(p.serverTs);
                    return (
                      <tr key={p.id} className="border-b border-slate-100 text-xs">
                        <td className="py-3 px-2 font-medium text-slate-800">{pDate.toLocaleDateString()}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.type === 'IN' ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-orange-100 text-orange-800 border border-orange-300'}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-700">{pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3 px-2 text-right">
                          {punchIsLate ? (
                            <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded font-bold">Late</span>
                          ) : p.type === 'IN' ? (
                            <span className="text-lime-800 bg-lime-50 border border-lime-200 px-2 py-1 rounded font-bold">On Time</span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* TASK PAUSE MODAL */}
      {selectedTaskToPause && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Pause className="text-amber-600" /> Select Task Pause Reason
            </h4>
            <p className="text-xs text-slate-500">Task: {selectedTaskToPause.title}</p>

            <div className="space-y-2">
              {PAUSE_REASONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setTaskPauseReason(r.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    taskPauseReason === r.id ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Optional Remark / Note</label>
              <input
                type="text"
                value={taskPauseNote}
                onChange={e => setTaskPauseNote(e.target.value)}
                placeholder="e.g. Waiting for oil filter delivery"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs p-3 rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelectedTaskToPause(null)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
              <button 
                onClick={() => updateTaskStatus(selectedTaskToPause.id, 'paused', taskPauseReason, taskPauseNote)}
                className="w-1/2 py-3 bg-amber-600 text-white font-black rounded-xl text-xs"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOUCH PARTS / VENDOR REQUISITION MODAL */}
      {showPartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Package className="text-lime-600" /> Add / Purchase Parts for Job
              </h4>
              <button onClick={() => setShowPartModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            {/* Source Switcher: In-Stock vs Outside Vendor */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPartSource('inventory')}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  partSource === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package size={14} /> In-Stock Inventory
              </button>
              <button
                type="button"
                onClick={() => setPartSource('vendor')}
                className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  partSource === 'vendor' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag size={14} /> Outside Vendor Purchase
              </button>
            </div>

            {partSource === 'inventory' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Select Part from Inventory</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {inventoryParts.map(part => (
                      <button 
                        key={part.id}
                        type="button"
                        onClick={() => setSelectedPartId(part.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPartId === part.id 
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold block text-sm">{part.name}</span>
                        <span className="text-xs opacity-90 block font-mono mt-0.5">{part.unitPrice} AED • Stock: {part.stockQuantity}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Quantity Needed</label>
                  <div className="flex items-center justify-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <button 
                      type="button"
                      onClick={() => setPartQty(Math.max(1, partQty - 1))}
                      className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 font-black text-2xl rounded-xl border border-slate-300 shadow-sm"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-3xl text-lime-700 px-6">{partQty}</span>
                    <button 
                      type="button"
                      onClick={() => setPartQty(partQty + 1)}
                      className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-800 font-black text-2xl rounded-xl border border-slate-300 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* VENDOR PURCHASE FORM */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Part / Item Name</label>
                  <input
                    type="text"
                    value={vendorPart.partName}
                    onChange={e => setVendorPart({ ...vendorPart, partName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                    placeholder="e.g. Mercedes Alternator Belt 6PK2300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vendor / Shop Name</label>
                    <input
                      type="text"
                      value={vendorPart.vendorName}
                      onChange={e => setVendorPart({ ...vendorPart, vendorName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                      placeholder="e.g. Speed Auto Parts LLC"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vendor Bill / Invoice #</label>
                    <input
                      type="text"
                      value={vendorPart.vendorInvoiceNumber}
                      onChange={e => setVendorPart({ ...vendorPart, vendorInvoiceNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                      placeholder="INV-99482"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={vendorPart.quantity}
                      onChange={e => setVendorPart({ ...vendorPart, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vendor Cost (AED)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={vendorPart.purchaseCost}
                      onChange={e => setVendorPart({ ...vendorPart, purchaseCost: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                      placeholder="Cost paid"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Client Price (AED)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={vendorPart.unitPrice}
                      onChange={e => setVendorPart({ ...vendorPart, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                      placeholder="Price to client"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleAddPartToJob}
              className="w-full py-3.5 bg-lime-600 hover:bg-lime-700 text-white font-black text-sm rounded-xl shadow-md transition-transform active:scale-95 mt-2"
            >
              {partSource === 'inventory' ? 'Add Inventory Part to Job' : 'Confirm Vendor Purchase & Attach to Job'}
            </button>
          </div>
        </div>
      )}

      {/* INTER-DEPARTMENT HANDOVER QWC MODAL */}
      {showQwcModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="text-lime-600" /> Inter-Department Handover (QWC)
                </h4>
                <p className="text-xs text-slate-500">
                  Passing Vehicle: <strong className="text-slate-800">[{qwcData.fromSection}] ➔ [{qwcData.toSection}]</strong>
                </p>
              </div>
              <button onClick={() => setShowQwcModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 font-medium leading-relaxed">
                <strong>⚠️ Quality & Damage Check:</strong> Verify that the vehicle is delivered free of new scratches, missing tools, or electrical faults before handing over to <strong>{qwcData.toSection}</strong> staff.
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 uppercase block">Handover Checklist Verification:</label>
                {qwcChecklist.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={item.passed}
                      onChange={e => {
                        const updated = [...qwcChecklist];
                        updated[idx].passed = e.target.checked;
                        setQwcChecklist(updated);
                      }}
                      className="w-4 h-4 text-lime-600 rounded"
                    />
                    <span className="font-medium text-slate-800">{item.item}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Handover Remarks / Notes</label>
                <textarea
                  value={qwcData.notes}
                  onChange={e => setQwcData({ ...qwcData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium"
                  placeholder="e.g. Denting and painting verified clean. Body clear for electrical wiring."
                />
              </div>
            </div>

            <button
              onClick={handleQwcSubmit}
              className="w-full py-3.5 bg-lime-600 hover:bg-lime-700 text-white font-black text-sm rounded-xl shadow-md transition-transform active:scale-95 mt-2 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} /> Sign Off & Handover to {qwcData.toSection}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
