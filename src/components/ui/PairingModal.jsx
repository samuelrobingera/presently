import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, ExternalLink, Check } from 'lucide-react';

const PairingModal = ({ sessionId, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const baseUrl = window.location.origin;
  const dsmUrl = `${baseUrl}/display/${sessionId}`;
  const barUrl = `${baseUrl}/display/${sessionId}?layout=bar`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
        <div className="flex justify-between items-center p-8 border-b border-gray-50">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Display Pairing</h3>
            <p className="text-gray-500 font-medium text-sm mt-1">Connect stage monitors and video overlays instantly.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-6 bg-gray-50 rounded-[48px] border-4 border-gray-100 shadow-inner">
              <QRCodeSVG 
                value={dsmUrl} 
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                }}
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">
                Scan to Instant Pair
              </span>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Full-Screen DSM</label>
              <div className="flex space-x-2">
                <input 
                  readOnly 
                  value={dsmUrl}
                  className="flex-grow bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 py-3 text-xs font-bold text-gray-500 overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={() => copyToClipboard(dsmUrl)}
                  className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Timer Bar Overlay</label>
              <div className="flex space-x-2">
                <input 
                  readOnly 
                  value={barUrl}
                  className="flex-grow bg-gray-50 border-2 border-gray-50 rounded-2xl px-4 py-3 text-xs font-bold text-gray-500 overflow-hidden text-ellipsis"
                />
                <button 
                  onClick={() => copyToClipboard(barUrl)}
                  className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
              <div className="flex items-start">
                <ExternalLink className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                  These URLs use anonymous authentication tokens. They will remain valid until the session is completed or archived.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button 
                onClick={onClose}
                className="text-sm font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest"
            >
                Dismiss Window
            </button>
        </div>
      </div>
    </div>
  );
};

export default PairingModal;
