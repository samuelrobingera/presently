import React from 'react';
import { Clock, Users, Zap, Shield, Smartphone, Globe, ArrowRight } from 'lucide-react';

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-rose-600 p-2 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">PRESENTLY</span>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors">Features</a>
              <button 
                onClick={onLaunch}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                Launch App
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-rose-50 rounded-full blur-3xl -z-10 opacity-50"></div>
          
          <div className="inline-flex items-center space-x-2 bg-rose-50 border border-rose-100 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-700">Live Stage Synchronization Active</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Precision Timing<br />
            <span className="text-rose-600">For The Big Stage.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            The professional standard for multi-room venue management and speaker success. Zero installation, sub-second sync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={onLaunch}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-rose-200 flex items-center justify-center group"
            >
              Start Timing Now
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto bg-white border-2 border-slate-100 hover:border-rose-600 hover:text-rose-600 text-slate-500 px-10 py-5 rounded-2xl font-black text-lg transition-all">
              Book A Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-rose-600" />}
              title="Tri-Phase Logic"
              description="Preparation, Presentation, and Q&A phases with automatic transitions and overtime tracking."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-rose-600" />}
              title="Global Sync"
              description="Instant state mirroring across DSMs, timer bars, and mobile devices via secure pairing."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-rose-600" />}
              title="Enterprise RBAC"
              description="Role-based access control for production teams, venue managers, and guest speakers."
            />
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-rose-600" />}
              title="Tactile Alerts"
              description="Haptic feedback thresholds dispatched to mobile devices and wearables."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-rose-600" />}
              title="Multi-Room Control"
              description="Manage facility-wide fleets of physical rooms from a centralized registry."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-rose-600" />}
              title="Deep Analytics"
              description="Track utilization and speaker performance metrics across your organization."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Presently</span>
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            © 2026 Presently SaaS. Proprietary Professional Infrastructure.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-12 rounded-[40px] border border-white shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-rose-600 group-hover:rotate-6 transition-all duration-500">
      <div className="group-hover:text-white transition-colors">
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
