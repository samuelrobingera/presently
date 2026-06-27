import React from 'react';
import { Plus, Trash2, Palette, Bell, Clock, Zap } from 'lucide-react';

const PhaseVisualEditor = ({ phase, onUpdate }) => {
  const addWarningThreshold = () => {
    const newThreshold = {
      minutesRemaining: 5,
      action: 'solid',
      color: '#fbbf24'
    };

    onUpdate({
      warningThresholds: [...(phase.warningThresholds || []), newThreshold]
    });
  };

  const removeWarningThreshold = (index) => {
    const updated = [...phase.warningThresholds];
    updated.splice(index, 1);
    onUpdate({ warningThresholds: updated });
  };

  const updateWarningThreshold = (index, updates) => {
    const updated = [...phase.warningThresholds];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ warningThresholds: updated });
  };

  const updateCriticalThreshold = (updates) => {
    onUpdate({
      criticalThreshold: { ...phase.criticalThreshold, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
          <Palette className="w-4 h-4 mr-2" />
          Color Palette
        </h5>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block">Normal State</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={phase.color.normal}
                onChange={(e) => onUpdate({ color: { ...phase.color, normal: e.target.value } })}
                className="w-12 h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={phase.color.normal}
                onChange={(e) => onUpdate({ color: { ...phase.color, normal: e.target.value } })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block">Warning State</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={phase.color.warning}
                onChange={(e) => onUpdate({ color: { ...phase.color, warning: e.target.value } })}
                className="w-12 h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={phase.color.warning}
                onChange={(e) => onUpdate({ color: { ...phase.color, warning: e.target.value } })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-2 block">Critical State</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={phase.color.critical}
                onChange={(e) => onUpdate({ color: { ...phase.color, critical: e.target.value } })}
                className="w-12 h-12 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={phase.color.critical}
                onChange={(e) => onUpdate({ color: { ...phase.color, critical: e.target.value } })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Thresholds */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Warning Thresholds
          </h5>
          <button
            onClick={addWarningThreshold}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-all"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Add Warning
          </button>
        </div>

        <div className="space-y-3">
          {phase.warningThresholds?.map((threshold, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200"
            >
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Minutes Left
                  </label>
                  <input
                    type="number"
                    value={threshold.minutesRemaining}
                    onChange={(e) =>
                      updateWarningThreshold(index, {
                        minutesRemaining: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Action
                  </label>
                  <select
                    value={threshold.action}
                    onChange={(e) => updateWarningThreshold(index, { action: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="solid">Solid</option>
                    <option value="flash">Flash</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">
                    <Palette className="w-3 h-3 inline mr-1" />
                    Color
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={threshold.color}
                      onChange={(e) => updateWarningThreshold(index, { color: e.target.value })}
                      className="w-10 h-10 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={threshold.color}
                      onChange={(e) => updateWarningThreshold(index, { color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeWarningThreshold(index)}
                className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(!phase.warningThresholds || phase.warningThresholds.length === 0) && (
            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No warning thresholds configured
            </div>
          )}
        </div>
      </div>

      {/* Critical Threshold */}
      <div>
        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
          <Bell className="w-4 h-4 mr-2 text-rose-600" />
          Critical Threshold (Time Expires)
        </h5>

        {phase.criticalThreshold ? (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Minutes Left
                </label>
                <input
                  type="number"
                  value={phase.criticalThreshold.minutesRemaining}
                  onChange={(e) =>
                    updateCriticalThreshold({
                      minutesRemaining: parseInt(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Action
                </label>
                <select
                  value={phase.criticalThreshold.action}
                  onChange={(e) => updateCriticalThreshold({ action: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="solid">Solid</option>
                  <option value="flash">Flash</option>
                  <option value="pulse">Pulse</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  <Palette className="w-3 h-3 inline mr-1" />
                  Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={phase.criticalThreshold.color}
                    onChange={(e) => updateCriticalThreshold({ color: e.target.value })}
                    className="w-10 h-10 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={phase.criticalThreshold.color}
                    onChange={(e) => updateCriticalThreshold({ color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No critical threshold configured
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <div>
        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Advanced Options
        </h5>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={phase.pulseEffect || false}
                onChange={(e) => onUpdate({ pulseEffect: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">Pulse Effect</div>
                <div className="text-xs text-slate-600 mt-1">
                  Apply continuous pulsing animation during this phase
                </div>
              </div>
            </label>

            {phase.pulseEffect && (
              <div className="mt-3">
                <label className="text-xs font-bold text-slate-600 mb-1 block">
                  Pulse Interval (seconds)
                </label>
                <input
                  type="number"
                  value={phase.pulseInterval || 2}
                  onChange={(e) => onUpdate({ pulseInterval: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={phase.autoAdvance || false}
                onChange={(e) => onUpdate({ autoAdvance: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">Auto-Advance</div>
                <div className="text-xs text-slate-600 mt-1">
                  Automatically move to next phase when timer reaches 00:00
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
          Live Preview
        </h5>

        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-8 rounded-2xl text-center"
            style={{ backgroundColor: phase.color.normal, color: '#fff' }}
          >
            <div className="text-xs font-bold uppercase mb-2">Normal</div>
            <div className="text-4xl font-black">10:00</div>
          </div>

          <div
            className="p-8 rounded-2xl text-center"
            style={{ backgroundColor: phase.color.warning, color: '#000' }}
          >
            <div className="text-xs font-bold uppercase mb-2">Warning</div>
            <div className="text-4xl font-black">02:00</div>
          </div>

          <div
            className={`p-8 rounded-2xl text-center ${phase.pulseEffect ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: phase.color.critical, color: '#fff' }}
          >
            <div className="text-xs font-bold uppercase mb-2">Critical</div>
            <div className="text-4xl font-black">00:00</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseVisualEditor;
