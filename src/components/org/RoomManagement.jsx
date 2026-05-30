import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, Users, Check, X } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { useAuth } from '../../context/AuthContext';

const RoomManagement = () => {
  const { organization, user, isDemo } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: 20 });

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await roomService.getRooms(organization, user, isDemo);
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [organization, user, isDemo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, formData, isDemo);
      } else {
        await roomService.createRoom({
          ...formData,
          orgId: organization.id,
          allowedEmails: []
        }, isDemo);
      }
      setShowAddModal(false);
      setEditingRoom(null);
      setFormData({ name: '', capacity: 20 });
      loadRooms();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.deleteRoom(id, isDemo);
        loadRooms();
      } catch (error) {
        console.error('Failed to delete room:', error);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading registry...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Room Registry</h2>
          <p className="text-gray-500 font-medium">Manage your physical venue inventory and capacity.</p>
        </div>
        <button
          onClick={() => {
            setEditingRoom(null);
            setFormData({ name: '', capacity: 20 });
            setShowAddModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center shadow-lg shadow-blue-200 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Physical Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setEditingRoom(room);
                    setFormData({ name: room.name, capacity: room.capacity });
                    setShowAddModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(room.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
            <div className="flex items-center text-gray-400 text-xs font-black uppercase tracking-widest">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {room.capacity} Capacity
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
               <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                 {room.available ? 'Available' : 'Occupied'}
               </span>
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                 ID: {room.id.slice(-6).toUpperCase()}
               </span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] shadow-2xl p-10 w-full max-w-md border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Room Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Grand Ballroom"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Capacity</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-grow bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all"
                >
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
