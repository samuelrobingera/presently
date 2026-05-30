import React from 'react';
import { BarChart3, TrendingUp, PieChart, Calendar, Download } from 'lucide-react';

const Analytics = () => {
  const usageStats = [
    { name: 'Grand Ballroom', util: 85 },
    { name: 'Conference Suite A', util: 62 },
    { name: 'Executive Boardroom', util: 45 },
    { name: 'Meeting Room 4', util: 30 }
  ];

  const punctualityData = [
    { day: 'Mon', val: 92 },
    { day: 'Tue', val: 88 },
    { day: 'Wed', val: 95 },
    { day: 'Thu', val: 78 },
    { day: 'Fri', val: 90 }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Facility Analytics</h2>
          <p className="text-gray-500 font-medium text-lg">Real-time telemetry and historical utilization reports.</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg shadow-gray-200">
          <Download className="w-4 h-4" />
          <span>Generate Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Utilization */}
        <div className="bg-white rounded-[40px] shadow-sm p-10 border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-gray-900">Room Utilization</h3>
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-8">
            {usageStats.map(room => (
              <div key={room.name}>
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">
                  <span>{room.name}</span>
                  <span className="text-gray-900">{room.util}% Capacity</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${room.util}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speaker Punctuality */}
        <div className="bg-white rounded-[40px] shadow-sm p-10 border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-gray-900">Speaker Punctuality</h3>
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex items-end justify-between h-48 gap-4 px-2">
            {punctualityData.map(d => (
              <div key={d.day} className="flex-grow flex flex-col items-center group">
                <div 
                  className="w-full bg-purple-50 rounded-2xl group-hover:bg-purple-600 transition-all duration-500 relative"
                  style={{ height: `${d.val}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    {d.val}% ON TIME
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400 mt-6 tracking-widest">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-blue-900 rounded-[40px] shadow-2xl p-12 text-white relative overflow-hidden group">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <PieChart className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-black">Optimization Insight</h3>
              </div>
              <p className="text-blue-100/60 text-lg font-medium leading-relaxed mb-8">
                Your organization's peak usage occurs on <span className="text-white font-black">Tuesdays between 10:00 AM and 11:30 AM</span>. 
                Consider enabling automated buffer times during this window to prevent schedule slippage.
              </p>
              <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/50">
                Adjust Automated Buffers
              </button>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'AVG DURATION', val: '42m' },
                  { label: 'OVERTIME RATE', val: '12%' },
                  { label: 'DAILY SESSIONS', val: '24' },
                  { label: 'USER SATISFACTION', val: '4.8/5' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-2xl font-black">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Decorative Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
