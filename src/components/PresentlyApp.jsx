import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import LandingPage from './LandingPage';
import AppLayout from './layout/AppLayout';
import RoomSelector from './RoomSelector';
import TimerInterface from './TimerInterface';
import DisplayView from './DisplayView';
import OrgDashboard from './org/OrgDashboard';
import SuperAdminPortal from './superadmin/SuperAdminPortal';
import OfflineIndicator, { ReconnectedToast } from './ui/OfflineIndicator';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const PresentlyApp = () => {
  const { user, loading, login, isSuperAdminUser } = useAuth();
  const { currentRoom } = useTimer();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showSettings, setShowSettings] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
    }
  }, [wasOffline, isOnline]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <div className="text-xl mb-2">Initializing Presently...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <ReconnectedToast show={showReconnected} onHide={() => setShowReconnected(false)} />
      <Routes>
        <Route path="/" element={<LandingPage onLaunch={() => navigate('/app')} user={user} />} />
        <Route path="/display/:sessionId" element={<DisplayView />} />
      
      <Route 
        path="/app" 
        element={
          user ? (
            <AppLayout 
              onShowSettings={() => setShowSettings(true)} 
              view="app"
              setView={(v) => navigate(v === 'org' ? '/app/org' : '/app')}
            >
              {currentRoom ? <TimerInterface /> : <RoomSelector />}
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      <Route
        path="/app/org"
        element={
          user ? (
            <OrgDashboard onBack={() => navigate('/app')} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/super-admin"
        element={
          user && isSuperAdminUser ? (
            <SuperAdminPortal />
          ) : user ? (
            <Navigate to="/app" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-100">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome</h1>
                <p className="text-gray-500 font-medium">Continue to your dashboard</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={async () => {
                    await login('google');
                    navigate('/app');
                  }}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-4 rounded-2xl border-2 border-gray-100 transition-all flex items-center justify-center shadow-sm"
                >
                  Sign in with Google
                </button>
                <button
                  onClick={async () => {
                    await login('google', true);
                    navigate('/app');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center shadow-lg"
                >
                  Demo Mode Access
                </button>
              </div>
            </div>
          </div>
        }
      />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default PresentlyApp;
