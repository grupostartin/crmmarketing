import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import BootAnimation from './components/BootAnimation';
import { LayoutDashboard, Trello, CheckSquare, FileText, Users, Settings as SettingsIcon, Search, Bell, LogOut, Building2, Zap } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import QuizBuilder from './pages/QuizBuilder';
import QuizList from './pages/QuizList';
import PublicQuiz from './pages/PublicQuiz';
import Contracts from './pages/Contracts';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Agency from './pages/Agency';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InvitePage from './pages/InvitePage';
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import EnvWarning from './components/EnvWarning';
import { supabase } from './lib/supabase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AgencyProvider, useAgency } from './context/AgencyContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import ToastContainer from './components/ToastContainer';

import Plans from './pages/Plans';
import LandingPage from './pages/LandingPage';

// --- Components ---

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 transition-all border-l-4 ${active
      ? 'bg-retro-surface border-retro-pink text-retro-pink'
      : 'border-transparent hover:bg-retro-surface/50 hover:border-retro-comment text-retro-fg'
      }`}
  >
    <Icon size={20} strokeWidth={2.5} />
    <span className="text-xl tracking-wide uppercase">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { currentUserRole } = useAgency();

  return (
    <aside className="w-64 bg-retro-bg border-r-4 border-black flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b-4 border-black bg-retro-surface mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black shadow-pixel-sm flex items-center justify-center">
            <img src={logo} alt="StartinOS Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-header text-sm text-retro-fg leading-none mb-1">StartinOS</h1>
            <p className="text-retro-comment text-sm leading-none">CRM Beta</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
        <SidebarItem to="/pipeline" icon={Trello} label="Pipeline" active={location.pathname === '/pipeline'} />
        <SidebarItem to="/quiz" icon={CheckSquare} label="Quizzes" active={location.pathname === '/quiz'} />
        <SidebarItem to="/contracts" icon={FileText} label="Contratos" active={location.pathname === '/contracts'} />
        <SidebarItem to="/contacts" icon={Users} label="Contatos" active={location.pathname === '/contacts'} />
        <SidebarItem to="/agency" icon={Building2} label="Agência" active={location.pathname === '/agency'} />
        {currentUserRole === 'owner' && (
          <SidebarItem to="/plans" icon={Zap} label="Planos" active={location.pathname === '/plans'} />
        )}
      </nav>

      <div className="p-4 border-t-4 border-black mt-auto">
        <Link to="/settings" className={`flex items-center gap-2 text-retro-comment hover:text-retro-fg transition-colors w-full p-2 ${location.pathname === '/settings' ? 'text-retro-fg' : ''}`}>
          <SettingsIcon size={18} />
          <span>CONFIGURAÇÕES</span>
        </Link>
      </div>
    </aside>
  );
};

const Header = () => {
  const { profileImage } = useTheme();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleNotificationClick = (id: string, type: string) => {
    markAsRead(id);
    setShowNotifications(false);

    switch (type) {
      case 'lead_new':
        navigate('/contacts');
        break;
      case 'deal_update':
        navigate('/pipeline');
        break;
      case 'system':
        navigate('/agency');
        break;
      default:
        // Stay or go to dashboard
        break;
    }
  };

  return (
    <header className="h-20 bg-retro-bg border-b-4 border-black flex items-center justify-between px-8 sticky top-0 z-10 ml-64">
      <div className="flex items-center bg-retro-surface border-2 border-black px-3 py-1 w-96 shadow-pixel-sm">
        <Search size={18} className="text-retro-comment mr-2" />
        <input
          type="text"
          placeholder="Pesquisar..."
          className="bg-transparent border-none outline-none text-retro-fg placeholder-retro-comment w-full font-body text-lg"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            className="relative group"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} className="text-retro-fg group-hover:text-retro-yellow transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-retro-red border border-black flex items-center justify-center text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-4 w-80 bg-cardDark border-4 border-black shadow-pixel z-50 max-h-96 overflow-y-auto">
               <div className="p-3 border-b-2 border-black bg-retro-surface flex justify-between items-center sticky top-0">
                  <span className="font-display text-sm">Notificações</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-retro-cyan hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
               </div>
               <div className="flex flex-col">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-retro-comment text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b-2 border-black/20 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-retro-surface/50' : ''}`}
                        onClick={() => handleNotificationClick(notification.id, notification.type)}
                      >
                        <div className="flex items-start gap-3">
                           <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.read ? 'bg-retro-cyan' : 'bg-transparent'}`}></div>
                           <div>
                              <h4 className="font-display text-sm text-white mb-1">{notification.title}</h4>
                              <p className="text-retro-comment text-xs leading-relaxed">{notification.message}</p>
                              <span className="text-[10px] text-gray-600 mt-2 block uppercase tracking-wider">
                                {new Date(notification.created_at).toLocaleTimeString()}
                              </span>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm leading-none text-retro-cyan">Admin User</p>
            <p className="text-xs text-retro-comment">Super Admin</p>
          </div>
          <div className="w-10 h-10 border-2 border-black shadow-pixel-sm overflow-hidden bg-retro-surface">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <img src="https://picsum.photos/id/64/100/100" alt="Default Profile" className="w-full h-full object-cover" />
            )}
          </div>
          <button onClick={handleLogout} className="text-retro-comment hover:text-retro-red ml-2">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

const PlanBanner = () => {
  const { agency, currentUserRole } = useAgency();
  if (!agency || agency.subscription_tier !== 'free') return null;

  return (
    <div className="bg-retro-yellow border-4 border-black p-4 mb-8 shadow-pixel flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-black text-retro-yellow p-2">
          <Zap size={24} fill="currentColor" />
        </div>
        <div>
          <p className="text-black font-bold text-lg leading-none">Plano Grátis Ativo</p>
          <p className="text-black/80 text-sm">
            {currentUserRole === 'owner'
              ? 'Você possui limites de uso. Faça upgrade para remover restrições.'
              : 'Peça ao gestor da agência para assinar o plano Pro.'}
          </p>
        </div>
      </div>
      {currentUserRole === 'owner' && (
        <Link to="/plans" className="bg-black text-retro-yellow px-6 py-3 font-bold uppercase hover:bg-black/80 transition-colors border-2 border-transparent hover:border-white shadow-pixel-sm whitespace-nowrap">
          Fazer Upgrade
        </Link>
      )}
    </div>
  );
};

const MainLayout = () => {
  const [showBoot, setShowBoot] = useState(true);

  if (showBoot) {
    return <BootAnimation onComplete={() => setShowBoot(false)} />;
  }

  return (
    <div className="min-h-screen bg-retro-bg text-retro-fg selection:bg-retro-pink selection:text-black">
      <Sidebar />
      <Header />
      <main className="ml-64 p-8">
        <EnvWarning />
        <PlanBanner />
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
};

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

function App() {
  return (
    <ThemeProvider>
      <AgencyProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/lp" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/quiz/public/:id" element={<PublicQuiz />} />
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/quiz" element={<QuizList />} />
                  <Route path="/quiz/builder/:id?" element={<QuizBuilder />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/agency" element={<Agency />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/plans" element={<Plans />} />
                </Route>
                <Route path="/quiz/builder/:id?" element={<QuizBuilder />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/agency" element={<Agency />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/plans" element={<Plans />} />
              </Route>
            </Routes>
          </Router>
        </NotificationProvider>
      </AgencyProvider>
    </ThemeProvider>
  );
}

export default App;