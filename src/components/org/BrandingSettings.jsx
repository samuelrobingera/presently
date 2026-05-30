import React, { useState } from 'react';
import { Palette, Type, Layout, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BrandingSettings = () => {
  const { organization, isDemo } = useAuth();
  const [saved, setSaved] = useState(false);
  const [config, setFormData] = useState({
    primaryColor: '#e11d48', // Rose 600
    accentColor: '#f59e0b', // Amber 500
    fontFamily: 'font-sans',
    logoUrl: '',
    customMessage: ''
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Visual Branding</h2>
          <p className="text-gray-500 font-medium text-lg">Customize the look and feel of your organization's display endpoints.</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center shadow-lg transition-all"
        >
          {saved ? <><Check className="w-4 h-4 mr-2" /> Changes Saved</> : <><Save className="w-4 h-4 mr-2" /> Save Branding</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Theme Palette</label>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Primary</p>
                    <div className="flex items-center space-x-2">
                        <input type="color" value={config.primaryColor} className="w-10 h-10 rounded-xl overflow-hidden border-0 p-0" />
                        <span className="text-xs font-black uppercase">{config.primaryColor}</span>
                    </div>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">Accent</p>
                    <div className="flex items-center space-x-2">
                        <input type="color" value={config.accentColor} className="w-10 h-10 rounded-xl overflow-hidden border-0 p-0" />
                        <span className="text-xs font-black uppercase">{config.accentColor}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Typography</label>
              <select className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 font-bold outline-none focus:border-blue-500 transition-all">
                <option>Inter (Modern Sans)</option>
                <option>Roboto (Clean)</option>
                <option>JetBrains Mono (Technical)</option>
                <option>Public Sans (Professional)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Organization Logo</label>
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-8 text-center hover:border-blue-300 transition-all cursor-pointer">
                 <Layout className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                 <p className="text-[10px] font-black uppercase text-gray-400">Click to Upload PNG/SVG</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2 space-y-6">
            <label className="block text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Live Display Preview</label>
            <div className="bg-gray-900 rounded-[48px] p-1 shadow-2xl relative overflow-hidden group">
                {/* Mock Display View */}
                <div className="bg-black rounded-[44px] aspect-video flex flex-col items-center justify-center relative">
                    <div className="absolute top-8 left-12 opacity-40">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: config.primaryColor }}></div>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">{organization?.name || 'ACME CORP'}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-8xl font-black text-white tabular-nums tracking-tighter mb-4">12:45</div>
                        <div className="inline-flex items-center px-6 py-2 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-[0.2em] text-white">
                            PRESENTATION PHASE
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-12 left-12 right-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-2/3" style={{ backgroundColor: config.primaryColor }}></div>
                    </div>
                </div>
                {/* Glossy Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent"></div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start">
                <Palette className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                    Custom branding is automatically applied to all unauthenticated Display Views and the Timer Bar Overlay.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;
