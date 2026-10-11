import { useState, useEffect } from 'react';
import { CheckCircle2, UserCircle } from 'lucide-react';

const mockEmployees = [
  { id: '1', name: 'Ahmed Ali', role: 'Mechanic', status: 'OUT' },
  { id: '2', name: 'Sara Khan', role: 'Advisor', status: 'IN' },
  { id: '3', name: 'John Doe', role: 'Electrician', status: 'OUT' },
  { id: '4', name: 'Fatima N.', role: 'Manager', status: 'IN' },
];

export default function Kiosk() {
  const [time, setTime] = useState(new Date());
  const [employees, setEmployees] = useState<{ id: string, name: string, role: string, status: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);
  const [pin, setPin] = useState('');
  const [punchState, setPunchState] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');
  const [errorMsg, setErrorMsg] = useState('');

  // Set Page Title as per user requirement
  useEffect(() => {
    document.title = "Fazah - Attendance";
  }, []);

  useEffect(() => {
    fetch('/api/kiosk/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => {
        console.error('Failed to fetch employees, using fallback:', err);
        setEmployees(mockEmployees);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
    }
  };

  const handleEnter = () => {
    if (pin.length > 0) {
      submitPunch(pin);
    }
  };

  const handleClear = () => setPin('');

  const submitPunch = async (finalPin: string) => {
    setPunchState('LOADING');
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/kiosk/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee?.id,
          pin: finalPin,
          type: selectedEmployee?.status === 'IN' ? 'OUT' : 'IN'
        })
      });
      
      if (!res.ok) throw new Error('Punch failed');
      
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee?.id 
          ? { ...emp, status: emp.status === 'IN' ? 'OUT' : 'IN' }
          : emp
      ));
      
      setPunchState('SUCCESS');
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to punch. Please try again.');
      setPunchState('IDLE');
      setPin('');
      return;
    }

    setTimeout(() => {
      setPunchState('IDLE');
      setSelectedEmployee(null);
      setPin('');
    }, 3000);
  };

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div className="animated-bg"></div>
      
      <div className="h-screen w-screen flex flex-col p-6 text-slate-100 font-sans bg-slate-900">
        
        {/* Header with FAZAH AUTO GARAGE Logo & Brand Colors */}
        <header className="flex justify-between items-center mb-6 bg-slate-800 border border-slate-700/80 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="FAZAH AUTO GARAGE" className="h-14 w-14 object-contain drop-shadow" />
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white leading-tight">
                FAZAH <span className="text-lime-400">AUTO</span> <span className="text-blue-500">GARAGE</span>
              </h1>
              <p className="text-xs text-slate-300 font-medium">Entrance Punch Kiosk • Main Workshop Bay</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <h2 className="text-3xl font-black text-white font-mono tracking-widest">{timeString}</h2>
            <p className="text-xs text-lime-400 font-semibold">{dateString}</p>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* Left Panel: Employee Select Grid */}
          <div className="w-1/2 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 flex flex-col shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <UserCircle className="text-lime-400" />
              Select Profile to Clock IN / OUT
            </h3>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 flex-1">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setPin('');
                    setPunchState('IDLE');
                    setErrorMsg('');
                  }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    selectedEmployee?.id === emp.id 
                      ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-900/80 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-lg font-extrabold text-white">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{emp.name}</h4>
                    <p className="text-xs text-slate-300">{emp.role}</p>
                  </div>
                  <div className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    emp.status === 'IN' ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {emp.status}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Touch Keypad Action Area */}
          <div className="w-1/2 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
            
            {!selectedEmployee && (
              <div className="text-center opacity-85 flex flex-col items-center">
                <div className="w-24 h-24 mb-4 relative flex items-center justify-center bg-slate-900 rounded-2xl p-2 border border-slate-700 shadow-lg">
                  <img src="/logo.png" alt="FAZAH Logo" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Tap Your Profile to Punch</h3>
                <p className="text-slate-300 max-w-xs text-sm">Select your name on the left grid, then enter your 6-digit secret PIN.</p>
              </div>
            )}

            {selectedEmployee && punchState === 'IDLE' && (
              <div className="flex flex-col items-center w-full max-w-xs animate-fade-in duration-300">
                <div className="mb-4 text-center">
                  <h3 className="text-2xl font-black text-white">Enter 6-Digit PIN</h3>
                  <p className="text-lime-400 text-sm font-semibold">for {selectedEmployee.name} ({selectedEmployee.role})</p>
                </div>

                <div className="flex gap-3 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        i < pin.length ? 'bg-lime-400 scale-125 shadow-lg shadow-lime-400/50' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {errorMsg && (
                  <div className="text-red-300 mb-4 bg-red-500/20 px-4 py-2 rounded-xl text-xs border border-red-500/30 font-bold">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 w-full">
                  {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(key => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'C') handleClear();
                        else if (key === '⌫') setPin(pin.slice(0, -1));
                        else handlePinPress(key);
                      }}
                      className="py-4 bg-slate-900 hover:bg-slate-700 text-white font-extrabold text-2xl rounded-2xl border border-slate-700 active:scale-95 transition-all shadow-md"
                    >
                      {key}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={handleEnter}
                  disabled={pin.length === 0}
                  className="mt-5 w-full bg-gradient-to-r from-blue-600 to-lime-500 hover:from-blue-500 hover:to-lime-400 disabled:opacity-40 text-white font-black text-lg py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                  Confirm Punch {selectedEmployee.status === 'IN' ? 'OUT' : 'IN'}
                </button>
              </div>
            )}

            {punchState === 'LOADING' && (
              <div className="flex flex-col items-center animate-fade-in duration-300">
                <div className="w-16 h-16 border-4 border-lime-400/20 border-t-lime-400 rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-slate-200">Verifying PIN...</h3>
              </div>
            )}

            {punchState === 'SUCCESS' && selectedEmployee && (
              <div className="flex flex-col items-center text-center animate-zoom-in duration-500">
                <div className="w-24 h-24 bg-lime-500/20 border border-lime-500/40 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-lime-500/20">
                  <CheckCircle2 size={56} className="text-lime-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-1">
                  Punch {selectedEmployee.status === 'IN' ? 'OUT' : 'IN'} Verified!
                </h2>
                <p className="text-lg font-mono text-lime-400 font-bold">{timeString}</p>
                <p className="text-slate-200 mt-4 text-sm font-medium">Welcome, {selectedEmployee.name}!</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
