import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function App() {
  const { t, i18n } = useTranslation();

  // Handle RTL for Arabic
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">GarageClock</h1>
          <nav className="flex gap-4 items-center">
            <Link to="/" className="hover:text-blue-500">{t('dashboard')}</Link>
            <Link to="/login" className="hover:text-blue-500">{t('login')}</Link>
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded shadow-sm text-sm"
            >
              {i18n.language === 'en' ? 'عربي' : 'English'}
            </button>
          </nav>
        </header>
        
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<div className="text-2xl">{t('greeting')}</div>} />
            <Route path="/login" element={<div>Login Page Placeholder</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
