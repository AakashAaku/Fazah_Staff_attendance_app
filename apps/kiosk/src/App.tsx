import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Kiosk from './pages/Kiosk';
import Admin from './pages/Admin';
import EmployeePortal from './pages/EmployeePortal';
import AppNavigation from './components/AppNavigation';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 pb-16 md:pb-0">
        <AppNavigation />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
            <Route path="/kiosk" element={<Kiosk />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/portal/*" element={<EmployeePortal />} />
            <Route path="*" element={<Navigate to="/kiosk" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
