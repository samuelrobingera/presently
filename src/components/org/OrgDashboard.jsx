import React, { useState } from 'react';
import { Database, CreditCard, MessageSquare, BarChart3, Shield, ArrowLeft, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RoomManagement from './RoomManagement';
import Billing from './Billing';
import Integrations from './Integrations';
import Analytics from './Analytics';
import BrandingSettings from './BrandingSettings';

const OrgDashboard = ({ onBack }) => {
  const { organization, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('rooms');

  const tabs = [
    { id: 'rooms', label: 'Room Registry', icon: <Database className="w-4 h-4" /> },
    { id: 'branding', label: 'Visual Identity', icon: <Palette className="w-4 h-4" /> },
    { id: 'billing', label: 'SaaS Licensing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'integrations', label: 'Ecosystem', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'analytics', label: 'Intelligence', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'security', label: 'Security & SSO', icon: <Shield className="w-4 h-4" />, ownerOnly: true }
  ];

  const filteredTabs = tabs.filter(tab => !tab.ownerOnly || userRole === 'owner');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="bg-slate-900 sticky top-0 z-30 border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-rose-600 p-3 rounded-2xl mr-5 shadow-xl shadow-rose-900/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">Admin Terminal</h1>
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.3em] mt-0.5">{organization?.name || 'Enterprise Portal'}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:w-72 flex-shrink-0">
          <nav className="space-y-3 sticky top-36">
            {filteredTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-4 px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-rose-600 text-white shadow-2xl shadow-rose-200 translate-x-2' 
                    : 'text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'
                }`}
              >
                <span className={`${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow bg-white rounded-[48px] p-12 shadow-sm border border-slate-100 min-h-[600px]">
          {activeTab === 'rooms' && <RoomManagement />}
          {activeTab === 'branding' && <BrandingSettings />}
          {activeTab === 'billing' && <Billing />}
          {activeTab === 'integrations' && <Integrations />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'security' && (
            <div className="p-12 text-center h-full flex flex-col items-center justify-center">
              <Shield className="w-20 h-20 text-rose-100 mb-8" />
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Enterprise Guard</h3>
              <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                SAML 2.0 and OIDC configuration is currently being provisioned for your tenant. Contact support to accelerate activation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrgDashboard;
