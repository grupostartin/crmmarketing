import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
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
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import EnvWarning from './components/EnvWarning';
import { supabase } from './lib/supabase';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AgencyProvider } from './context/AgencyContext';

import Plans from './pages/Plans';

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

  return (
    <aside className="w-64 bg-retro-bg border-r-4 border-black flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b-4 border-black bg-retro-surface mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-retro-cyan border-2 border-black shadow-pixel-sm"></div>
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
        <SidebarItem to="/plans" icon={Zap} label="Planos" active={location.pathname === '/plans'} />
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

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
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
        <button className="relative group">
          <Bell size={24} className="text-retro-fg group-hover:text-retro-yellow transition-colors" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-retro-red border border-black"></span>
        </button>
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

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-retro-bg text-retro-fg selection:bg-retro-pink selection:text-black">
      <Sidebar />
      <Header />
      <main className="ml-64 p-8">
        <EnvWarning />
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AgencyProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/quiz/public/:id" element={<PublicQuiz />} />

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
            </Route>
          </Routes>
        </Router>
      </AgencyProvider>
    </ThemeProvider>
  );
}

export default App;