import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Kiosk from './pages/Kiosk';
import Admin from './pages/Admin';
import EmployeePortal from './pages/EmployeePortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/kiosk" replace />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/portal/*" element={<EmployeePortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
