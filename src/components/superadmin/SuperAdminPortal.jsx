import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';

const SuperAdminPortal = () => {
  const { user, isDemo, isSuperAdminUser } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [notification, setNotification] = useState(null);

  // Redirect if not super-admin
  useEffect(() => {
    if (!isSuperAdminUser && !loading) {
      navigate('/');
    }
  }, [isSuperAdminUser, loading, navigate]);

  useEffect(() => {
    loadOrganizations();
  }, [isDemo]);

  useEffect(() => {
    filterOrganizations();
  }, [searchTerm, organizations]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await superAdminService.getAllOrganizations(isDemo);
      setOrganizations(orgs);
    } catch (error) {
      showNotification('Failed to load organizations', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    if (!searchTerm.trim()) {
      setFilteredOrgs(organizations);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = organizations.filter(org =>
      org.name.toLowerCase().includes(term) ||
      org.domain.toLowerCase().includes(term) ||
      org.ownerEmail?.toLowerCase().includes(term)
    );
    setFilteredOrgs(filtered);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateOrUpdate = async (orgData) => {
    try {
      if (editingOrg) {
        await superAdminService.updateOrganization(editingOrg.id, orgData, isDemo);
        showNotification('Organization updated successfully');
      } else {
        await superAdminService.createOrganization(orgData, isDemo);
        showNotification('Organization created successfully');
      }
      setShowCreateModal(false);
      setEditingOrg(null);
      loadOrganizations();
    } catch (error) {
      showNotification('Failed to save organization', 'error');
      console.error(error);
    }
  };

  const handleDelete = async (orgId) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await superAdminService.deleteOrganization(orgId, isDemo);
        showNotification('Organization deleted');
        loadOrganizations();
      } catch (error) {
        showNotification('Failed to delete organization', 'error');
        console.error(error);
      }
    }
  };

  const openEditModal = (org) => {
    setEditingOrg(org);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingOrg(null);
  };

  if (!isSuperAdminUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-600 to-rose-700 sticky top-0 z-30 border-b border-rose-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <Shield className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
                Super-Admin Portal
              </h1>
              <p className="text-[10px] text-rose-200 font-black uppercase tracking-[0.3em] mt-0.5">
                Organization Management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs font-bold text-rose-200">{user?.email}</div>
              <div className="text-[10px] font-black text-white uppercase tracking-widest">Super Admin</div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </header>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Building2 className="w-6 h-6" />}
            label="Total Organizations"
            value={organizations.length}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Active Subscriptions"
            value={organizations.filter(o => o.subscription?.status === 'active').length}
            color="green"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Admins"
            value={organizations.reduce((sum, o) => sum + (o.adminEmails?.length || 0) + 1, 0)}
            color="purple"
          />
          <StatCard
            icon={<CreditCard className="w-6 h-6" />}
            label="Monthly Revenue"
            value={`$${organizations.reduce((sum, o) => sum + (o.subscription?.pricePerMonth || 0), 0).toFixed(0)}`}
            color="rose"
          />
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search organizations by name, domain, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:border-rose-600 focus:outline-none text-slate-900 font-medium"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setEditingOrg(null);
                setShowCreateModal(true);
              }}
              className="ml-6 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm uppercase tracking-wide transition-all flex items-center space-x-2 shadow-lg shadow-rose-200"
            >
              <Plus className="w-5 h-5" />
              <span>New Organization</span>
            </button>
          </div>
        </div>

        {/* Organizations List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
              <div className="animate-spin w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Loading organizations...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                {searchTerm ? 'No organizations found' : 'No organizations yet'}
              </p>
            </div>
          ) : (
            filteredOrgs.map(org => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onEdit={() => openEditModal(org)}
                onDelete={() => handleDelete(org.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <OrganizationModal
          organization={editingOrg}
          onSave={handleCreateOrUpdate}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  );
};

// Organization Card Component
const OrganizationCard = ({ organization, onEdit, onDelete }) => {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
              {organization.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {organization.name}
              </h3>
              <p className="text-sm text-slate-500 font-medium">{organization.domain}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                statusColors[organization.subscription?.status] || statusColors.pending
              }`}
            >
              {organization.subscription?.status || 'Pending'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Owner</div>
              <div className="text-sm font-bold text-slate-900">{organization.ownerEmail || 'Not set'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Plan</div>
              <div className="text-sm font-bold text-slate-900">{organization.subscription?.plan || 'None'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Rooms</div>
              <div className="text-sm font-bold text-slate-900">{organization.subscription?.roomLicenses || 0}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Monthly</div>
              <div className="text-sm font-bold text-slate-900">
                ${organization.subscription?.pricePerMonth?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {organization.adminEmails && organization.adminEmails.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Admins</div>
              <div className="flex flex-wrap gap-2">
                {organization.adminEmails.map((email, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Organization Modal Component
const OrganizationModal = ({ organization, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    domain: organization?.domain || '',
    domains: organization?.domains || [],
    ownerEmail: organization?.ownerEmail || '',
    adminEmails: organization?.adminEmails || [],
    subscription: {
      plan: organization?.subscription?.plan || 'Starter',
      status: organization?.subscription?.status || 'active',
      roomLicenses: organization?.subscription?.roomLicenses || 5,
      pricePerMonth: organization?.subscription?.pricePerMonth || 49.00,
      startDate: organization?.subscription?.startDate || new Date().toISOString().split('T')[0],
      nextBillingDate: organization?.subscription?.nextBillingDate || ''
    },
    settings: {
      ssoEnabled: organization?.settings?.ssoEnabled || false,
      brandingEnabled: organization?.settings?.brandingEnabled || false
    }
  });

  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [errors, setErrors] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = superAdminService.validateOrganization(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    onSave(formData);
  };

  const addAdminEmail = () => {
    if (adminEmailInput.trim() && !formData.adminEmails.includes(adminEmailInput.trim())) {
      setFormData({
        ...formData,
        adminEmails: [...formData.adminEmails, adminEmailInput.trim()]
      });
      setAdminEmailInput('');
    }
  };

  const removeAdminEmail = (email) => {
    setFormData({
      ...formData,
      adminEmails: formData.adminEmails.filter(e => e !== email)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6">
          {organization ? 'Edit Organization' : 'Create Organization'}
        </h2>

        {errors.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <div className="font-bold text-rose-900">Please fix the following errors:</div>
            </div>
            <ul className="list-disc list-inside text-sm text-rose-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Primary Domain *
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="company.com"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Owner Email *
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="admin@company.com"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Admin Emails */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Admin Emails (Optional)
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="email"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAdminEmail())}
                placeholder="admin@company.com"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addAdminEmail}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm uppercase tracking-wide transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.adminEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg"
                >
                  <span className="text-sm font-medium text-slate-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeAdminEmail(email)}
                    className="text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription */}
          <div className="border-t-2 border-slate-100 pt-6">
            <h3 className="text-lg font-black text-slate-900 uppercase mb-4">Subscription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Plan
                </label>
                <select
                  value={formData.subscription.plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, plan: e.target.value }
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Enterprise Pro">Enterprise Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={formData.subscription.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, status: e.target.value }
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Room Licenses
                </label>
                <input
                  type="number"
                  value={formData.subscription.roomLicenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, roomLicenses: parseInt(e.target.value) || 0 }
                    })
                  }
                  min="1"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Price/Month ($)
                </label>
                <input
                  type="number"
                  value={formData.subscription.pricePerMonth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription: { ...formData.subscription, pricePerMonth: parseFloat(e.target.value) || 0 }
                    })
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-rose-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-wide transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg shadow-rose-200"
            >
              {organization ? 'Update' : 'Create'} Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminPortal;
