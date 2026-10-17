import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, UserCheck, Shield, Download, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import InstallModal from './InstallModal';

export default function AppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const navItems = [
    { path: '/kiosk', label: 'Punch Kiosk', shortLabel: 'Kiosk', icon: Clock },
    { path: '/portal', label: 'Staff Portal', shortLabel: 'Portal', icon: UserCheck },
    { path: '/admin', label: 'Admin Console', shortLabel: 'Admin', icon: Shield },
  ];

  const isCurrent = (path: string) => {
    if (path === '/kiosk' && (location.pathname === '/' || location.pathname.startsWith('/kiosk'))) return true;
    if (path === '/portal' && location.pathname.startsWith('/portal')) return true;
    if (path === '/admin' && location.pathname.startsWith('/admin')) return true;
    return false;
  };

  const handleInstallClick = () => {
    if (isInstallable) {
      promptInstall();
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      {/* Top Navigation Bar - Clean, Compact & Glassmorphic */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-3 sm:px-6 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => navigate('/kiosk')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity select-none"
          >
            <img src="/logo.png" alt="FAZAH Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-contain drop-shadow" />
            <div className="hidden xs:block">
              <span className="text-sm sm:text-base font-black tracking-wide text-white leading-tight">
                FAZAH <span className="text-lime-400">AUTO</span> <span className="text-blue-500">GARAGE</span>
              </span>
            </div>
          </div>

          {/* Center Tabs - Desktop & Tablet */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-lime-300' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Action Controls: PWA Install */}
          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-lime-500/15 hover:bg-lime-500/25 border border-lime-500/40 text-lime-300 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Install Fazah App as Desktop or Mobile PWA"
              >
                <Download size={14} className="text-lime-400 animate-bounce" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            {isInstalled && (
              <span className="hidden sm:flex items-center gap-1 bg-slate-800/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-xl text-2xs font-semibold">
                <Smartphone size={12} className="text-lime-400" /> PWA Mode
              </span>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar - Fixed thumb navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 text-slate-200 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className={`grid ${!isInstalled ? 'grid-cols-4' : 'grid-cols-3'} gap-1 items-center max-w-md mx-auto`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  active
                    ? 'text-lime-400 bg-slate-800/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <Icon size={18} className={active ? 'text-lime-400 scale-110 transition-transform' : ''} />
                <span className="text-2xs mt-0.5 tracking-tight">{item.shortLabel}</span>
              </button>
            );
          })}

          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-lime-400 hover:text-lime-300 font-medium transition-all"
            >
              <Download size={18} className="animate-bounce" />
              <span className="text-2xs mt-0.5">Install</span>
            </button>
          )}
        </div>
      </nav>

      {/* Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstall={promptInstall}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />
    </>
  );
}
