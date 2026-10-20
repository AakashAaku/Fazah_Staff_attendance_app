import { useState, useEffect } from 'react';
import { CheckCircle2, UserCircle, Search, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function Kiosk() {
  const [time, setTime] = useState(new Date());
  const [employees, setEmployees] = useState<{ id: string, name: string, role: string, status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);
  const [pin, setPin] = useState('');
  const [punchState, setPunchState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentDateStr, setCurrentDateStr] = useState(() => new Date().toDateString());

  // Set Page Title
  useEffect(() => {
    document.title = "Fazah - Entrance Attendance Kiosk";
  }, []);

  const loadEmployees = () => {
    setLoading(true);
    // Auto-close any stale sessions from previous dates (default 8 PM punch-out)
    apiFetch('/api/kiosk/auto-close-stale', { method: 'POST' })
      .catch(() => {}) // silent fail - best effort
      .finally(() => {
        apiFetch('/api/kiosk/employees')
          .then(res => {
            if (!res.ok) throw new Error('API request failed');
            return res.json();
          })
          .then(data => {
            if (Array.isArray(data)) {
              setEmployees(data);
            } else {
              setEmployees([]);
            }
          })
          .catch(err => {
            console.error('Failed to fetch kiosk employees:', err);
            setEmployees([]);
          })
          .finally(() => setLoading(false));
      });
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Clock tick + Auto-refresh when crossing to a new date (midnight rollover)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      const todayStr = now.toDateString();
      if (todayStr !== currentDateStr) {
        setCurrentDateStr(todayStr);
        loadEmployees();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // Periodic status refresh every 60s when idle
  useEffect(() => {
    const interval = setInterval(() => {
      if (pin === '' && punchState === 'IDLE') {
        loadEmployees();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [pin, punchState]);

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch (_) {}
  };

  const handlePinPress = (digit: string) => {
    triggerHaptic();
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleEnter = () => {
    if (pin.length > 0) {
      triggerHaptic();
      submitPunch(pin);
    }
  };

  const handleClear = () => {
    triggerHaptic();
    setPin('');
  };

  const handleBackspace = () => {
    triggerHaptic();
    setPin(prev => prev.slice(0, -1));
  };

  const submitPunch = async (finalPin: string) => {
    setPunchState('LOADING');
    setErrorMsg('');
    
    try {
      const res = await apiFetch('/api/kiosk/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee?.id,
          pin: finalPin,
          type: selectedEmployee?.status === 'IN' ? 'OUT' : 'IN'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Invalid PIN or punch failed');
      }
      
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee?.id 
          ? { ...emp, status: emp.status === 'IN' ? 'OUT' : 'IN' }
          : emp
      ));
      
      setPunchState('SUCCESS');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Failed to verify PIN. Please try again.');
      setPunchState('IDLE');
      setPin('');
      return;
    }

    setTimeout(() => {
      setPunchState('IDLE');
      setSelectedEmployee(null);
      setPin('');
    }, 2800);
  };

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] w-full flex flex-col p-3 sm:p-6 text-slate-100 font-sans max-w-7xl mx-auto">
      <div className="animated-bg"></div>
      
      {/* Kiosk Header - Responsive Layout */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 bg-slate-800/90 border border-slate-700/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src="/logo.png" alt="FAZAH AUTO GARAGE" className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow" />
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-wide text-white leading-tight">
              FAZAH <span className="text-lime-400">AUTO</span> <span className="text-blue-500">GARAGE</span>
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Workshop Bay Attendance Clock • Main Entrance
            </p>
          </div>
        </div>
        
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-700/60 pt-2 sm:pt-0">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-lime-400 sm:hidden" />
            <h2 className="text-xl sm:text-3xl font-black text-white font-mono tracking-widest">{timeString}</h2>
          </div>
          <p className="text-xs text-lime-400 font-semibold">{dateString}</p>
        </div>
      </header>

      {/* Main Content Area - Responsive Flex Grid */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 sm:gap-6">
        
        {/* Left Panel: Employee Select Grid (Hidden on Mobile when an Employee is being punched) */}
        <div className={`w-full md:w-1/2 bg-slate-800/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col shadow-lg backdrop-blur-md ${
          selectedEmployee ? 'hidden md:flex' : 'flex'
        }`}>
          
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
              <UserCircle className="text-lime-400 shrink-0" size={20} />
              <span>Select Profile to Clock</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {filteredEmployees.length} Staff
            </span>
          </div>

          {/* Quick Search Input */}
          <div className="relative mb-3 sm:mb-4">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or trade..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[55vh] md:max-h-none flex-1 pr-1">
            {filteredEmployees.map(emp => (
              <button
                key={emp.id}
                onClick={() => {
                  triggerHaptic();
                  setSelectedEmployee(emp);
                  setPin('');
                  setPunchState('IDLE');
                  setErrorMsg('');
                }}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-left active:scale-[0.98] ${
                  selectedEmployee?.id === emp.id 
                    ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400' 
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-base sm:text-lg font-extrabold text-white shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate">{emp.name}</h4>
                  <p className="text-2xs sm:text-xs text-slate-300 truncate">{emp.role}</p>
                </div>
                <div className={`text-2xs sm:text-xs font-black px-2 sm:px-2.5 py-1 rounded-full shrink-0 ${
                  emp.status === 'IN' 
                    ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {emp.status}
                </div>
              </button>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-7 h-7 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-slate-300">Loading staff members...</span>
                  </>
                ) : (
                  <>
                    <span>{searchQuery ? 'No matching staff members found.' : 'No active staff members found.'}</span>
                    <button
                      onClick={loadEmployees}
                      className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-xs active:scale-95"
                    >
                      Refresh List
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Touch Keypad Action Area (Shown on Desktop always, Shown on Mobile when Employee Selected) */}
        <div className={`w-full md:w-1/2 bg-slate-800/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative shadow-lg backdrop-blur-md ${
          !selectedEmployee ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Mobile Back Button to change employee selection */}
          {selectedEmployee && (
            <div className="w-full flex items-center justify-between mb-3 md:hidden">
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setPin('');
                  setErrorMsg('');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl active:scale-95"
              >
                <ArrowLeft size={14} /> Back to Staff List
              </button>
              <span className="text-2xs text-lime-400 font-mono font-bold">
                Status: {selectedEmployee.status}
              </span>
            </div>
          )}

          {/* Idle State when no employee is selected on Desktop */}
          {!selectedEmployee && (
            <div className="text-center opacity-85 flex flex-col items-center py-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 relative flex items-center justify-center bg-slate-900 rounded-2xl p-2 border border-slate-700 shadow-lg">
                <img src="/logo.png" alt="FAZAH Logo" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Tap Your Profile to Punch</h3>
              <p className="text-slate-300 max-w-xs text-xs sm:text-sm">
                Select your name on the left grid, then enter your 6-digit secret PIN to register attendance.
              </p>
            </div>
          )}

          {/* Active Keypad State */}
          {selectedEmployee && punchState === 'IDLE' && (
            <div className="flex flex-col items-center w-full max-w-xs animate-fade-in duration-200">
              <div className="mb-3 sm:mb-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 mb-2">
                  <div className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></div>
                  <span className="text-xs font-bold text-white">{selectedEmployee.name}</span>
                  <span className="text-2xs text-slate-400">({selectedEmployee.role})</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Enter 6-Digit PIN</h3>
                <p className="text-2xs sm:text-xs text-slate-400">Default PIN: 123456</p>
              </div>

              {/* PIN Dots */}
              <div className="flex gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                      i < pin.length 
                        ? 'bg-lime-400 scale-125 shadow-lg shadow-lime-400/50' 
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="text-rose-300 mb-3 bg-rose-500/20 px-3 py-1.5 rounded-xl text-xs border border-rose-500/30 font-bold text-center w-full">
                  {errorMsg}
                </div>
              )}

              {/* Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'C') handleClear();
                      else if (key === '⌫') handleBackspace();
                      else handlePinPress(key);
                    }}
                    className="h-14 sm:h-16 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-xl sm:text-2xl rounded-xl sm:rounded-2xl border border-slate-700 active:scale-95 transition-all shadow-md flex items-center justify-center select-none"
                  >
                    {key}
                  </button>
                ))}
              </div>
              
              <button 
                type="button"
                onClick={handleEnter}
                disabled={pin.length === 0}
                className="mt-4 sm:mt-5 w-full bg-gradient-to-r from-blue-600 to-lime-500 hover:from-blue-500 hover:to-lime-400 disabled:opacity-40 text-white font-black text-base sm:text-lg py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 select-none"
              >
                <ShieldCheck size={20} />
                Confirm Punch {selectedEmployee.status === 'IN' ? 'OUT' : 'IN'}
              </button>
            </div>
          )}

          {/* Loading State */}
          {punchState === 'LOADING' && (
            <div className="flex flex-col items-center py-10 animate-fade-in duration-200">
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-lime-400/20 border-t-lime-400 rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-200">Verifying Security PIN...</h3>
              <p className="text-xs text-slate-400 mt-1">Recording punch timestamp</p>
            </div>
          )}

          {/* Success State */}
          {punchState === 'SUCCESS' && selectedEmployee && (
            <div className="flex flex-col items-center text-center py-8 animate-zoom-in duration-300">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-lime-500/20 border border-lime-500/40 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-lime-500/20">
                <CheckCircle2 size={48} className="text-lime-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Clocked {selectedEmployee.status === 'IN' ? 'OUT' : 'IN'}!
              </h2>
              <p className="text-base sm:text-lg font-mono text-lime-400 font-bold">{timeString}</p>
              <p className="text-slate-200 mt-3 text-sm font-semibold">
                Safe work shift, {selectedEmployee.name}!
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
