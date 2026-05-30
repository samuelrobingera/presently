import React from 'react';
import { MessageSquare, Slack, Globe, Terminal, Check, Plus } from 'lucide-react';

const Integrations = () => {
  const integrationList = [
    { 
      name: 'Microsoft Teams', 
      desc: 'Sync timers directly with Teams meetings and lobby displays.', 
      status: 'connected', 
      color: 'bg-indigo-600',
      icon: <Terminal className="w-6 h-6 text-white" />
    },
    { 
      name: 'Slack', 
      desc: 'Send automated session alerts to specific workspace channels.', 
      status: 'available', 
      color: 'bg-orange-500',
      icon: <Slack className="w-6 h-6 text-white" />
    },
    { 
      name: 'Google Meet', 
      desc: 'Chrome extension for meeting overlay and speaker notes.', 
      status: 'available', 
      color: 'bg-green-600',
      icon: <Globe className="w-6 h-6 text-white" />
    },
    { 
      name: 'Discord', 
      desc: 'Real-time room status bot and technician voice alerts.', 
      status: 'available', 
      color: 'bg-blue-500',
      icon: <MessageSquare className="w-6 h-6 text-white" />
    }
  ];

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Ecosystem Integrations</h2>
        <p className="text-gray-500 font-medium text-lg">Connect Presently with your organization's existing communication stack.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationList.map(app => (
          <div key={app.name} className="p-8 rounded-[40px] border border-gray-100 hover:border-blue-200 transition-all flex items-start group bg-white shadow-sm hover:shadow-md">
            <div className={`${app.color} w-16 h-16 rounded-[24px] mr-6 flex-shrink-0 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
              {app.icon}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-black text-gray-900 text-lg">{app.name}</h3>
                {app.status === 'connected' && (
                  <span className="flex items-center text-[10px] font-black uppercase text-green-600 tracking-widest bg-green-50 px-2 py-0.5 rounded-lg">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">{app.desc}</p>
              <button className={`text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all ${
                app.status === 'connected' 
                  ? 'bg-gray-100 text-gray-500 cursor-default' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100'
              }`}>
                {app.status === 'connected' ? 'Configure' : 'Enable Link'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Webhook Section */}
      <div className="bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
         <div className="relative z-10">
            <h3 className="text-2xl font-black mb-2">Custom Webhooks</h3>
            <p className="text-gray-400 text-sm max-w-lg mb-8 font-medium">
              Developer-first foundation for custom automation. Dispatch real-time telemetry to your own internal endpoints ($POST JSON).
            </p>
            <button className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center hover:bg-gray-100 transition-all">
               <Plus className="w-4 h-4 mr-2" />
               Register Webhook Endpoint
            </button>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
      </div>
    </div>
  );
};

export default Integrations;
