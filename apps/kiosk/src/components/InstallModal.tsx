import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone, Monitor } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  isInstalled: boolean;
}

export default function InstallModal({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
  isInstalled,
}: InstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-lime-500/20 text-lime-400 border border-lime-500/30 rounded-2xl">
            <Download size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Install Fazah Garage App</h3>
            <p className="text-xs text-slate-400">Desktop & Mobile Progressive Web App (PWA)</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="text-center py-6">
            <CheckCircle2 size={56} className="text-lime-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">App Already Installed!</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You are running Fazah Auto Garage in standalone app mode. Enjoy lightning-fast workshop workflows!
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-300">
              Install this app directly on your iPhone or iPad home screen:
            </p>
            <div className="space-y-3 bg-slate-800/80 border border-slate-700 p-4 rounded-2xl text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <span>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar (<Share size={14} className="inline text-blue-400" />)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (<PlusSquare size={14} className="inline text-lime-400" />)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">3</span>
                <span>Tap <strong className="text-white">"Add"</strong> in the top right corner</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-slate-800/70 border border-slate-700 rounded-2xl">
              <Monitor size={20} className="text-blue-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Desktop Windows / macOS / Linux</p>
                <p className="text-slate-400">Installs as a standalone native window on your desktop.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-800/70 border border-slate-700 rounded-2xl">
              <Smartphone size={20} className="text-lime-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">Mobile Android / Chrome</p>
                <p className="text-slate-400">Installs full-screen app icon to your phone app drawer.</p>
              </div>
            </div>

            <button
              onClick={onInstall}
              disabled={!isInstallable}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-lime-500 hover:from-blue-500 hover:to-lime-400 text-white font-black py-3.5 rounded-xl text-base shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-40"
            >
              <Download size={18} />
              {isInstallable ? 'Install App Now' : 'Use Browser Menu (⋮) to Install'}
            </button>

            {!isInstallable && (
              <p className="text-center text-xs text-slate-500">
                Click your browser menu (⋮) in Chrome or Edge and select <strong>"Install app"</strong> or <strong>"Create shortcut"</strong>.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
