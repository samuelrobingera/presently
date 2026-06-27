import React from 'react';
import { Clock, Wifi, Settings, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AppLayout = ({ children, onShowSettings, view, setView }) => {
  const { user, organization, userRole, logout, isDemo, isSuperAdminUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 shadow-2xl sticky top-0 z-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="bg-rose-600 p-2 rounded-xl mr-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter">Presently</h1>
              
              <div className="ml-6 flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                {isDemo && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Live Demo</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {isSuperAdminUser && (
                <button
                  onClick={() => navigate('/super-admin')}
                  className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-700 hover:to-rose-800 shadow-xl shadow-rose-900/30 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Super-Admin</span>
                </button>
              )}

              {organization && (userRole === 'owner' || userRole === 'admin') && (
                <button
                  onClick={() => setView('org')}
                  className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-black/20"
                >
                  Admin Control
                </button>
              )}

              <div className="h-8 w-px bg-slate-800 mx-2"></div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-white uppercase tracking-tight leading-none">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{userRole}</p>
                </div>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-xl border-2 border-slate-800 object-cover shadow-lg" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border-2 border-slate-700">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
