import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  Edit,
  Copy,
  Palette,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { phaseConfigService } from '../../services/phaseConfigService';
import { useAuth } from '../../context/AuthContext';
import PhaseVisualEditor from './PhaseVisualEditor';

const PhaseConfigurator = () => {
  const { organization, user, isDemo } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [notification, setNotification] = useState(null);
  const [draggedPhase, setDraggedPhase] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, [organization, user]);

  const loadConfigs = async () => {
    const orgId = organization?.id;
    const userId = user?.uid;
    const fetchedConfigs = await phaseConfigService.getPhaseConfigs(orgId, userId, isDemo);
    setConfigs(fetchedConfigs);

    if (fetchedConfigs.length > 0 && !selectedConfig) {
      setSelectedConfig(fetchedConfigs[0]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const createNewConfig = () => {
    const newConfig = {
      id: `new-${Date.now()}`,
      name: 'New Configuration',
      description: '',
      phases: [
        {
          id: `phase-${Date.now()}`,
          name: 'Phase 1',
          order: 0,
          durationMinutes: 10,
          color: { normal: '#1e40af', warning: '#fbbf24', critical: '#dc2626' },
          warningThresholds: [{ minutesRemaining: 2, action: 'flash', color: '#fbbf24' }],
          criticalThreshold: { minutesRemaining: 0, action: 'solid', color: '#dc2626' },
          pulseEffect: false,
          autoAdvance: true
        }
      ],
      isDefault: false,
      isNew: true
    };
    setSelectedConfig(newConfig);
    setIsEditing(true);
  };

  const duplicateConfig = () => {
    if (!selectedConfig) return;

    const duplicated = {
      ...selectedConfig,
      id: `new-${Date.now()}`,
      name: `${selectedConfig.name} (Copy)`,
      isDefault: false,
      isNew: true
    };
    setSelectedConfig(duplicated);
    setIsEditing(true);
  };

  const saveConfig = async () => {
    if (!selectedConfig) return;

    const validation = phaseConfigService.validatePhaseConfig(selectedConfig);
    if (!validation.isValid) {
      showNotification(validation.errors.join(', '), 'error');
      return;
    }

    try {
      if (selectedConfig.isNew) {
        const { isNew, ...configData } = selectedConfig;
        const saved = await phaseConfigService.createPhaseConfig(
          {
            ...configData,
            orgId: organization?.id,
            userId: user?.uid
          },
          isDemo
        );
        showNotification('Configuration created successfully!');
        setIsEditing(false);
        loadConfigs();
      } else {
        await phaseConfigService.updatePhaseConfig(
          selectedConfig.id,
          {
            name: selectedConfig.name,
            description: selectedConfig.description,
            phases: selectedConfig.phases
          },
          isDemo
        );
        showNotification('Configuration updated successfully!');
        setIsEditing(false);
        loadConfigs();
      }
    } catch (error) {
      showNotification('Failed to save configuration', 'error');
      console.error(error);
    }
  };

  const deleteConfig = async () => {
    if (!selectedConfig || selectedConfig.isDefault) return;

    if (window.confirm(`Delete "${selectedConfig.name}"?`)) {
      try {
        await phaseConfigService.deletePhaseConfig(selectedConfig.id, isDemo);
        showNotification('Configuration deleted');
        loadConfigs();
        setSelectedConfig(null);
      } catch (error) {
        showNotification('Failed to delete configuration', 'error');
      }
    }
  };

  const addPhase = () => {
    if (!selectedConfig) return;

    const newPhase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${selectedConfig.phases.length + 1}`,
      order: selectedConfig.phases.length,
      durationMinutes: 10,
      color: { normal: '#1e40af', warning: '#fbbf24', critical: '#dc2626' },
      warningThresholds: [{ minutesRemaining: 2, action: 'flash', color: '#fbbf24' }],
      criticalThreshold: { minutesRemaining: 0, action: 'solid', color: '#dc2626' },
      pulseEffect: false,
      autoAdvance: true
    };

    setSelectedConfig({
      ...selectedConfig,
      phases: [...selectedConfig.phases, newPhase]
    });
  };

  const removePhase = (phaseId) => {
    if (!selectedConfig) return;

    const updatedPhases = selectedConfig.phases
      .filter(p => p.id !== phaseId)
      .map((p, index) => ({ ...p, order: index }));

    setSelectedConfig({
      ...selectedConfig,
      phases: updatedPhases
    });
  };

  const updatePhase = (phaseId, updates) => {
    if (!selectedConfig) return;

    const updatedPhases = selectedConfig.phases.map(p =>
      p.id === phaseId ? { ...p, ...updates } : p
    );

    setSelectedConfig({
      ...selectedConfig,
      phases: updatedPhases
    });
  };

  const handleDragStart = (phase) => {
    setDraggedPhase(phase);
  };

  const handleDragOver = (e, targetPhase) => {
    e.preventDefault();
    if (!draggedPhase || draggedPhase.id === targetPhase.id) return;

    const draggedIndex = selectedConfig.phases.findIndex(p => p.id === draggedPhase.id);
    const targetIndex = selectedConfig.phases.findIndex(p => p.id === targetPhase.id);

    const newPhases = [...selectedConfig.phases];
    newPhases.splice(draggedIndex, 1);
    newPhases.splice(targetIndex, 0, draggedPhase);

    const reordered = newPhases.map((p, index) => ({ ...p, order: index }));
    setSelectedConfig({ ...selectedConfig, phases: reordered });
  };

  const handleDragEnd = () => {
    setDraggedPhase(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Phase Templates
            </h2>
            <p className="text-slate-600">
              Create custom timer sequences with unique visual signaling for each phase.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={duplicateConfig}
              disabled={!selectedConfig}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-50"
            >
              <Copy className="w-4 h-4 inline mr-2" />
              Duplicate
            </button>
            <button
              onClick={createNewConfig}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm uppercase tracking-wide transition-all"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-50 font-bold text-sm uppercase tracking-wide ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Config List Sidebar */}
        <div className="col-span-3 space-y-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Templates
          </div>
          {configs.map(config => (
            <div
              key={config.id}
              onClick={() => {
                setSelectedConfig(config);
                setIsEditing(false);
              }}
              className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                selectedConfig?.id === config.id
                  ? 'bg-rose-50 border-rose-600 shadow-lg'
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900">{config.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                {config.phases.length} phases
              </div>
              {config.isDefault && (
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 mt-2 inline-block">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Config Editor */}
        <div className="col-span-9">
          {selectedConfig ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
              {/* Config Header */}
              <div className="mb-8 pb-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={selectedConfig.name}
                        onChange={(e) =>
                          setSelectedConfig({ ...selectedConfig, name: e.target.value })
                        }
                        className="text-2xl font-black text-slate-900 uppercase border-b-2 border-rose-600 focus:outline-none w-full"
                      />
                      <input
                        type="text"
                        value={selectedConfig.description || ''}
                        onChange={(e) =>
                          setSelectedConfig({ ...selectedConfig, description: e.target.value })
                        }
                        placeholder="Description (optional)"
                        className="text-sm text-slate-600 border-b border-slate-200 focus:outline-none w-full pb-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase">
                        {selectedConfig.name}
                      </h3>
                      {selectedConfig.description && (
                        <p className="text-sm text-slate-600 mt-2">{selectedConfig.description}</p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveConfig}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            loadConfigs();
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                        >
                          <X className="w-4 h-4 inline mr-2" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          disabled={selectedConfig.isDefault}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4 inline mr-2" />
                          Edit
                        </button>
                        {!selectedConfig.isDefault && (
                          <button
                            onClick={deleteConfig}
                            className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Phase List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    Phase Sequence
                  </h4>
                  {isEditing && (
                    <button
                      onClick={addPhase}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-all"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Phase
                    </button>
                  )}
                </div>

                {selectedConfig.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    draggable={isEditing}
                    onDragStart={() => handleDragStart(phase)}
                    onDragOver={(e) => handleDragOver(e, phase)}
                    onDragEnd={handleDragEnd}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      draggedPhase?.id === phase.id
                        ? 'opacity-50 scale-95'
                        : 'opacity-100 scale-100'
                    } ${
                      editingPhase?.id === phase.id
                        ? 'bg-rose-50 border-rose-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {isEditing && (
                          <GripVertical className="w-5 h-5 text-slate-400 mt-1 cursor-move" />
                        )}

                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={phase.name}
                                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                                className="text-lg font-bold text-slate-900 border-b-2 border-slate-300 focus:border-rose-600 focus:outline-none w-full pb-1"
                              />

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    Duration (min)
                                  </label>
                                  <input
                                    type="number"
                                    value={phase.durationMinutes}
                                    onChange={(e) =>
                                      updatePhase(phase.id, { durationMinutes: parseInt(e.target.value) || 0 })
                                    }
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-rose-600 focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                                    <Palette className="w-3 h-3 inline mr-1" />
                                    Normal Color
                                  </label>
                                  <input
                                    type="color"
                                    value={phase.color.normal}
                                    onChange={(e) =>
                                      updatePhase(phase.id, {
                                        color: { ...phase.color, normal: e.target.value }
                                      })
                                    }
                                    className="w-full h-10 border border-slate-300 rounded-lg cursor-pointer"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Effects
                                  </label>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <label className="flex items-center text-sm">
                                      <input
                                        type="checkbox"
                                        checked={phase.pulseEffect}
                                        onChange={(e) =>
                                          updatePhase(phase.id, { pulseEffect: e.target.checked })
                                        }
                                        className="mr-2"
                                      />
                                      Pulse
                                    </label>
                                    <label className="flex items-center text-sm">
                                      <input
                                        type="checkbox"
                                        checked={phase.autoAdvance}
                                        onChange={(e) =>
                                          updatePhase(phase.id, { autoAdvance: e.target.checked })
                                        }
                                        className="mr-2"
                                      />
                                      Auto
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setEditingPhase(editingPhase?.id === phase.id ? null : phase)}
                                className="text-xs font-bold text-rose-600 uppercase tracking-wide hover:text-rose-700"
                              >
                                {editingPhase?.id === phase.id ? 'Hide' : 'Show'} Advanced Settings
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: phase.color.normal }}
                                ></div>
                                <h5 className="text-lg font-bold text-slate-900">{phase.name}</h5>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <span>
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {phase.durationMinutes} min
                                </span>
                                <span>
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  {phase.warningThresholds?.length || 0} warnings
                                </span>
                                {phase.pulseEffect && (
                                  <span className="text-rose-600 font-bold">PULSE</span>
                                )}
                                {phase.autoAdvance && (
                                  <span className="text-emerald-600 font-bold">AUTO</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <button
                          onClick={() => removePhase(phase.id)}
                          disabled={selectedConfig.phases.length === 1}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Advanced Settings */}
                    {isEditing && editingPhase?.id === phase.id && (
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <PhaseVisualEditor
                          phase={phase}
                          onUpdate={(updates) => updatePhase(phase.id, updates)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
              <Palette className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                Select a template or create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhaseConfigurator;
