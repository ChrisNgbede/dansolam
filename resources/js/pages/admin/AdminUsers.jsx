import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Edit2, Trash2, Shield, Key, UserPlus, CheckCircle, AlertCircle,
  X, Search, Lock, Users, ChevronDown, ChevronUp, LayoutGrid
} from 'lucide-react';
import { apiFetch } from '../../hooks/useAuth';
import { useTableState } from '../../hooks/useTableState';
import TablePaginationControls from '../../components/ui/TablePaginationControls';
import SearchableSelect from '../../components/ui/SearchableSelect';

// ─── Full Permission Catalog ────────────────────────────────────────
// Optional module groups declare settingKey and are exposed for assignment
// only while that module is enabled in Settings > Modules.
const permissionCatalog = [
  {
    module: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', name: 'View Dashboard', desc: 'Access the analytics overview page' },
    ]
  },
  {
    module: 'Products',
    permissions: [
      { key: 'products.view', name: 'View Products', desc: 'Browse the product catalog' },
      { key: 'products.manage', name: 'Manage Products', desc: 'Create, edit, delete products & flash sales' },
      { key: 'categories.manage', name: 'Manage Categories', desc: 'Create, edit, and delete product categories' },
      { key: 'product_tags.manage', name: 'Manage Product Tags', desc: 'Create, edit, and delete product tags' },
    ]
  },
  {
    module: 'Collections',
    permissions: [
      { key: 'collections.view', name: 'View Collections', desc: 'Browse curated collections' },
      { key: 'collections.manage', name: 'Manage Collections', desc: 'Create, edit, and delete collections' },
    ]
  },
  {
    module: 'Orders',
    permissions: [
      { key: 'orders.view', name: 'View Orders', desc: 'Browse all customer orders' },
      { key: 'orders.manage', name: 'Manage Orders', desc: 'Update statuses and shipping details' },
      { key: 'orders.create', name: 'Create Orders', desc: 'Create manual or assisted customer orders' },
      { key: 'orders.export', name: 'Export Orders', desc: 'Download order data and invoices' },
      { key: 'orders.send_invoice', name: 'Send Order Invoices', desc: 'Email order invoices to customers' },
    ]
  },
  {
    module: 'Point of Sale',
    settingKey: 'module_pos_enabled',
    permissions: [
      { key: 'pos.access', name: 'Access POS', desc: 'Open the point-of-sale terminal' },
      { key: 'pos.checkout', name: 'Process Checkouts', desc: 'Create POS orders and collect payments' },
      { key: 'pos.register', name: 'Manage Register', desc: 'Open, close, and reconcile register sessions' },
      { key: 'pos.logs', name: 'View Register Logs', desc: 'Review POS session and transaction history' },
      { key: 'pos.cash_drawer', name: 'Manage Cash Drawer', desc: 'Record cash drawer movements' },
    ]
  },
  {
    module: 'Expenses',
    settingKey: 'module_expenses_enabled',
    permissions: [
      { key: 'expenses.view', name: 'View Expenses', desc: 'Browse expense records and summaries' },
      { key: 'expenses.manage', name: 'Manage Expenses', desc: 'Create, edit, and delete expenses' },
      { key: 'expenses.batch', name: 'Batch Expenses', desc: 'Create or process multiple expenses at once' },
    ]
  },
  {
    module: 'Purchases & Suppliers',
    settingKey: 'module_purchases_enabled',
    permissions: [
      { key: 'purchases.view', name: 'View Purchases', desc: 'Browse purchase orders and purchasing summaries' },
      { key: 'purchases.manage', name: 'Manage Purchases', desc: 'Create, update, cancel, and delete purchase orders' },
      { key: 'purchases.receive', name: 'Receive Purchases', desc: 'Receive purchase stock into inventory' },
      { key: 'purchases.batch', name: 'Batch Purchases', desc: 'Process multiple purchase orders at once' },
      { key: 'suppliers.view', name: 'View Suppliers', desc: 'Browse the supplier directory' },
      { key: 'suppliers.manage', name: 'Manage Suppliers', desc: 'Create and maintain supplier records' },
    ]
  },
  {
    module: 'Coupons',
    permissions: [
      { key: 'coupons.view', name: 'View Coupons', desc: 'Browse promo codes' },
      { key: 'coupons.manage', name: 'Manage Coupons', desc: 'Create, edit, and disable coupons' },
    ]
  },
  {
    module: 'Discounts',
    permissions: [
      { key: 'discounts.view', name: 'View Discounts', desc: 'Browse discount rules' },
      { key: 'discounts.manage', name: 'Manage Discounts', desc: 'Create, edit, and delete discount rules' },
    ]
  },
  {
    module: 'Reports',
    permissions: [
      { key: 'reports.view', name: 'View Reports', desc: 'Access sales and analytics reports' },
      { key: 'reports.export', name: 'Export Reports', desc: 'Download report CSV files' },
    ]
  },
  {
    module: 'Customers',
    permissions: [
      { key: 'customers.view', name: 'View Customers', desc: 'Browse customer records' },
      { key: 'customers.manage', name: 'Manage Customers', desc: 'Edit and delete customer accounts' },
    ]
  },
  {
    module: 'Reviews',
    permissions: [
      { key: 'reviews.view', name: 'View Reviews', desc: 'Browse customer reviews' },
      { key: 'reviews.moderate', name: 'Moderate Reviews', desc: 'Approve, reject, or delete reviews' },
    ]
  },
  {
    module: 'Inventory',
    permissions: [
      { key: 'inventory.view', name: 'View Inventory', desc: 'Browse stock logs and levels' },
      { key: 'inventory.manage', name: 'Manage Inventory', desc: 'Adjust stock and record movements' },
    ]
  },
  {
    module: 'Invoices',
    permissions: [
      { key: 'invoices.view', name: 'View Invoices', desc: 'Browse manual invoices' },
      { key: 'invoices.create', name: 'Create Invoices', desc: 'Generate new manual invoices' },
      { key: 'invoices.export', name: 'Export Invoices', desc: 'Download generated invoice documents' },
      { key: 'invoices.send', name: 'Send Invoices', desc: 'Email manual invoices to customers' },
    ]
  },
  {
    module: 'Newsletter',
    permissions: [
      { key: 'newsletter.view', name: 'View Subscribers', desc: 'Browse newsletter subscribers' },
      { key: 'newsletter.manage', name: 'Manage Subscribers', desc: 'Remove and maintain subscriber records' },
      { key: 'newsletter.export', name: 'Export Subscribers', desc: 'Download the newsletter subscriber list' },
    ]
  },
  {
    module: 'Gallery',
    permissions: [
      { key: 'gallery.view', name: 'View Gallery', desc: 'Browse photo gallery media' },
      { key: 'gallery.manage', name: 'Manage Gallery', desc: 'Upload and delete gallery items' },
    ]
  },
  {
    module: 'Articles',
    permissions: [
      { key: 'articles.view', name: 'View Articles', desc: 'Browse blog articles' },
      { key: 'articles.manage', name: 'Manage Articles', desc: 'Create, edit, and delete blog posts' },
      { key: 'blog_taxonomy.manage', name: 'Manage Blog Taxonomy', desc: 'Maintain blog categories and tags' },
      { key: 'blog_comments.moderate', name: 'Moderate Blog Comments', desc: 'Approve and delete article comments' },
    ]
  },
  {
    module: 'Hero Banners',
    permissions: [
      { key: 'hero.view', name: 'View Hero Banners', desc: 'Browse storefront hero slides' },
      { key: 'hero.manage', name: 'Manage Hero Banners', desc: 'Create, duplicate, edit, and delete hero slides' },
    ]
  },
  {
    module: 'Pages',
    permissions: [
      { key: 'pages.view', name: 'View Pages', desc: 'Browse CMS pages' },
      { key: 'pages.manage', name: 'Manage Pages', desc: 'Create, edit, and delete CMS pages' },
    ]
  },
  {
    module: 'FAQs',
    permissions: [
      { key: 'faqs.view', name: 'View FAQs', desc: 'Browse frequently asked questions' },
      { key: 'faqs.manage', name: 'Manage FAQs', desc: 'Create, edit, and delete FAQs' },
    ]
  },
  {
    module: 'Inquiries',
    permissions: [
      { key: 'inquiries.view', name: 'View Inquiries', desc: 'Browse contact submissions' },
      { key: 'inquiries.manage', name: 'Manage Inquiries', desc: 'Respond to and delete inquiries' },
    ]
  },
  {
    module: 'Brands',
    permissions: [
      { key: 'brands.view', name: 'View Brands', desc: 'Browse brand listings' },
      { key: 'brands.manage', name: 'Manage Brands', desc: 'Create, edit, and delete brands' },
    ]
  },
  {
    module: 'Staff & Roles',
    permissions: [
      { key: 'users.view', name: 'View Staff', desc: 'Browse staff member list' },
      { key: 'users.manage', name: 'Manage Staff', desc: 'Create, edit, delete staff and roles' },
    ]
  },
  {
    module: 'Settings',
    permissions: [
      { key: 'settings.view', name: 'View Settings', desc: 'Browse system configuration' },
      { key: 'settings.manage', name: 'Manage Settings', desc: 'Edit general, tax, and shipping settings' },
      { key: 'settings.modules', name: 'Manage Modules', desc: 'Enable and disable optional system modules' },
      { key: 'settings.payments', name: 'Manage Payments', desc: 'Configure payment gateways and channels' },
      { key: 'settings.email', name: 'Manage Email', desc: 'Configure and test email delivery settings' },
      { key: 'settings.demo_data', name: 'Manage Demo Data', desc: 'Seed or reset demonstration data' },
    ]
  },
  {
    module: 'Taxes',
    permissions: [
      { key: 'taxes.view', name: 'View Taxes', desc: 'Browse tax rules' },
      { key: 'taxes.manage', name: 'Manage Taxes', desc: 'Create, edit, and delete tax rules' },
    ]
  },
  {
    module: 'Shipping',
    permissions: [
      { key: 'shipping.view', name: 'View Shipping', desc: 'Browse shipping zones and rates' },
      { key: 'shipping.manage', name: 'Manage Shipping', desc: 'Create, edit, and delete shipping zones' },
    ]
  },
];

// ─── Color mappings for role badges ──────────────────────────────
const roleColors = {
  'super-admin': 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'store-manager': 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'fulfillment-staff': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

function getRoleBadgeClass(slug) {
  return roleColors[slug] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('staff');

  // ─── Shared UI feedback states ──────────────────────────────
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── STAFF state ──────────────────────────────
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);

  // ─── ROLES state ──────────────────────────────
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  // ─── Fetch data ──────────────────────────────
  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => apiFetch('/api/admin/users').then(res => res.json())
  });

  const { data: rolesRes, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => apiFetch('/api/admin/roles').then(res => res.json())
  });

  const { data: settingsRes } = useQuery({
    queryKey: ['admin-settings-panel'],
    queryFn: () => apiFetch('/api/admin/settings').then(res => res.json())
  });

  const users = usersRes?.data || [];
  const roles = rolesRes?.data || [];
  const moduleSettings = settingsRes?.data?.settings || {};
  const isModuleEnabled = (key) => [true, 1, '1', 'true', 'yes', 'on'].includes(moduleSettings[key]);
  const permissionModules = permissionCatalog.filter(module => !module.settingKey || isModuleEnabled(module.settingKey));
  const allPermissionKeys = permissionModules.flatMap(module => module.permissions.map(permission => permission.key));
  const visibleSelectedCount = rolePermissions.filter(permission => allPermissionKeys.includes(permission)).length;

  // ─── Table state for staff tab ──────────────────────────────
  const {
    searchQuery, setSearchQuery, sortField, sortOrder, requestSort,
    currentPage, setCurrentPage, pageSize, setPageSize,
    totalPages, paginatedData, jumpToPage, totalCount, filteredCount
  } = useTableState({
    data: users,
    defaultPageSize: 10,
    defaultSortField: 'name',
    defaultSortOrder: 'asc',
    searchKeys: ['name', 'email'],
    customFilter: (item, query) => {
      if (item.name?.toLowerCase().includes(query)) return true;
      if (item.email?.toLowerCase().includes(query)) return true;
      if (item.role?.name?.toLowerCase().includes(query)) return true;
      return false;
    }
  });

  // ─── Staff handlers ──────────────────────────────
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRoleId(roles.length > 0 ? roles[0].id : '');
    setErrorMsg('');
    setSuccessMsg('');
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword('');
    setUserRoleId(user.role_id || '');
    setErrorMsg('');
    setSuccessMsg('');
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setUserActionLoading(true);

    const payload = { name: userName, email: userEmail, role_id: parseInt(userRoleId) };
    if (userPassword) payload.password = userPassword;

    try {
      let res;
      if (editingUser) {
        res = await apiFetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        if (!userPassword) {
          setErrorMsg('Password is required for new user registrations.');
          setUserActionLoading(false);
          return;
        }
        payload.password = userPassword;
        res = await apiFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      setUserActionLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
        queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
        setTimeout(() => setShowUserModal(false), 1200);
      } else {
        setErrorMsg(data.message || 'Staff action failed.');
      }
    } catch {
      setUserActionLoading(false);
      setErrorMsg('Network error executing staff action.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to revoke this staff member access?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
        queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Error deleting user.');
    }
  };

  // ─── Role handlers ──────────────────────────────
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRolePermissions([]);
    
    // Default expand all modules so permissions checklist is fully visible on load
    const expanded = {};
    permissionModules.forEach(mod => {
      expanded[mod.module] = true;
    });
    setExpandedModules(expanded);
    
    setErrorMsg('');
    setSuccessMsg('');
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRolePermissions(role.permissions || []);
    
    // Default expand all modules so permissions checklist is fully visible on load
    const expanded = {};
    permissionModules.forEach(mod => {
      expanded[mod.module] = true;
    });
    setExpandedModules(expanded);
    
    setErrorMsg('');
    setSuccessMsg('');
    setShowRoleModal(true);
  };

  const handleTogglePermission = (key) => {
    setRolePermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleToggleModule = (module) => {
    const modulePerms = module.permissions.map(p => p.key);
    const allSelected = modulePerms.every(k => rolePermissions.includes(k));

    if (allSelected) {
      setRolePermissions(prev => prev.filter(p => !modulePerms.includes(p)));
    } else {
      setRolePermissions(prev => [...new Set([...prev, ...modulePerms])]);
    }
  };

  const handleToggleExpand = (moduleName) => {
    setExpandedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const handleSelectAllPermissions = () => {
    if (allPermissionKeys.every(permission => rolePermissions.includes(permission))) {
      setRolePermissions(current => current.filter(permission => !allPermissionKeys.includes(permission)));
    } else {
      setRolePermissions(current => [...new Set([...current, ...allPermissionKeys])]);
    }
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setRoleActionLoading(true);

    const payload = {
      name: roleName,
      description: roleDescription,
      permissions: rolePermissions,
    };

    try {
      let res;
      if (editingRole) {
        res = await apiFetch(`/api/admin/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/admin/roles', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      setRoleActionLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
        setTimeout(() => setShowRoleModal(false), 1200);
      } else {
        setErrorMsg(data.message || 'Role action failed.');
      }
    } catch {
      setRoleActionLoading(false);
      setErrorMsg('Network error executing role action.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ['admin-roles-list'] });
      } else {
        setErrorMsg(data.message);
      }
    } catch {
      setErrorMsg('Error deleting role.');
    }
  };

  // ─── RENDER ──────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-none font-sans text-gray-700 dark:text-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-serif font-bold text-2xl text-gray-900 dark:text-gray-100">Staff & Roles Manager</h2>
          <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 font-semibold">
            Manage team members, define roles, and assign granular access permissions.
          </p>
        </div>

        <button
          onClick={activeTab === 'staff' ? handleOpenAddUser : handleOpenAddRole}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'staff' ? 'Add Staff' : 'New Role'}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => { setActiveTab('staff'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Staff Members
        </button>
        <button
          onClick={() => { setActiveTab('roles'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Roles & Permissions
        </button>
      </div>

      {/* Global feedback */}
      {errorMsg && !showUserModal && !showRoleModal && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-150 dark:border-red-900/50 text-red-500 dark:text-red-300 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}
      {successMsg && !showUserModal && !showRoleModal && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-300 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* ════════════════ STAFF TAB ════════════════ */}
      {activeTab === 'staff' && (
        <>
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex-1 max-w-xl relative">
              <input
                type="text"
                placeholder="Search staff (name, email, role...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">
              👑 {filteredCount} staff members
            </span>
          </div>

          {usersLoading ? (
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl h-60 w-full animate-pulse" />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold select-none">
                    <th onClick={() => requestSort('name')} className="py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                      Name & Email {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Permissions</th>
                    <th onClick={() => requestSort('created_at')} className="py-3 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                      Joined {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{user.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getRoleBadgeClass(user.role?.slug)}`}>
                            {user.role?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            {user.role?.permissions?.length || 0} permissions
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[10px] text-gray-500 dark:text-gray-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-primary rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              title="Edit Staff"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No staff members found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredCount > 0 && (
                <TablePaginationControls
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  filteredCount={filteredCount}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  onJumpToPage={jumpToPage}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════ ROLES TAB ════════════════ */}
      {activeTab === 'roles' && (
        <>
          {rolesLoading ? (
            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl h-60 w-full animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  {/* Role header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        role.is_system ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {role.name}
                          {role.is_system && (
                            <Lock className="w-3 h-3 text-gray-400" title="System role — cannot be deleted" />
                          )}
                        </h3>
                        <span className="text-[10px] text-gray-400 font-medium">{role.slug}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Edit Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!role.is_system && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {role.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {role.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                      <Key className="w-3 h-3 text-primary" />
                      {role.permissions?.length || 0} permissions
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                      <Users className="w-3 h-3 text-blue-500" />
                      {role.users_count || 0} staff
                    </div>
                  </div>

                  {/* Permission preview tags */}
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions || []).slice(0, 5).map((p) => (
                      <span key={p} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[8px] font-medium">
                        {p}
                      </span>
                    ))}
                    {(role.permissions?.length || 0) > 5 && (
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-bold">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════ STAFF MODAL ════════════════ */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 border border-gray-100 dark:border-gray-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">
                {editingUser ? 'Edit Staff Member' : 'Register New Staff Member'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-150 dark:border-red-900/50 text-red-500 dark:text-red-300 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-300 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitUser} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    placeholder="name@dansolam.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-550 font-bold uppercase">
                    {editingUser ? 'Password (Leave blank to keep same)' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={userPassword}
                      onChange={e => setUserPassword(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      placeholder="••••••••"
                      required={!editingUser}
                    />
                    <Key className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Assigned Role</label>
                  <SearchableSelect
                    value={userRoleId}
                    onChange={e => setUserRoleId(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="">Select a role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </SearchableSelect>
                </div>
              </div>

              {/* Role preview */}
              {userRoleId && (() => {
                const selectedRole = roles.find(r => r.id === parseInt(userRoleId));
                if (!selectedRole) return null;
                return (
                  <div className="bg-gray-50 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase">
                        {selectedRole.name} — {selectedRole.permissions?.length || 0} permissions
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(selectedRole.permissions || []).slice(0, 8).map(p => (
                        <span key={p} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[8px] font-medium">
                          {p}
                        </span>
                      ))}
                      {(selectedRole.permissions?.length || 0) > 8 && (
                        <span className="text-[8px] text-primary font-bold">+{selectedRole.permissions.length - 8} more</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2.5 border-t border-gray-150 dark:border-gray-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-655 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {userActionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingUser ? 'Save Changes' : 'Register Staff Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════ ROLE MODAL ════════════════ */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-5 border border-gray-100 dark:border-gray-800 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-serif font-bold text-gray-900 dark:text-gray-100 text-lg">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-150 dark:border-red-900/50 text-red-500 dark:text-red-300 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-300 rounded-lg p-2.5 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitRole} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Role Name</label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={e => setRoleName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    placeholder="e.g. Content Editor"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Description</label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={e => setRoleDescription(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    placeholder="Brief description of this role"
                  />
                </div>
              </div>

              {/* Permissions by module */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Permissions ({visibleSelectedCount}/{allPermissionKeys.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                  >
                    {allPermissionKeys.every(permission => rolePermissions.includes(permission)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 h-[45vh] overflow-y-auto overscroll-contain pr-2">
                  {permissionModules.map((mod) => {
                    const modulePermKeys = mod.permissions.map(p => p.key);
                    const selectedCount = modulePermKeys.filter(k => rolePermissions.includes(k)).length;
                    const allModSelected = selectedCount === modulePermKeys.length;
                    const isExpanded = expandedModules[mod.module] ?? false;

                    return (
                      <div key={mod.module} className="shrink-0 border border-gray-150 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Module header */}
                        <div
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-colors ${
                            allModSelected ? 'bg-primary/5 dark:bg-primary/10' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => handleToggleExpand(mod.module)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={allModSelected}
                              onChange={(e) => { e.stopPropagation(); handleToggleModule(mod); }}
                              className="rounded border-gray-300 text-primary w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{mod.module}</span>
                            {mod.settingKey && (
                              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-600">
                                Enabled module
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400 font-medium">
                              {selectedCount}/{modulePermKeys.length}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>

                        {/* Expanded permissions list */}
                        {isExpanded && (
                          <div className="px-3 py-2 flex flex-col gap-1.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                            {mod.permissions.map((p) => {
                              const isChecked = rolePermissions.includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-start gap-2.5 p-2 rounded-md border cursor-pointer transition-all ${
                                    isChecked ? 'border-primary/40 bg-primary/5 dark:bg-primary/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(p.key)}
                                    className="rounded border-gray-300 text-primary w-3.5 h-3.5 shrink-0 mt-0.5 cursor-pointer"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{p.name}</span>
                                    <span className="text-[9px] text-gray-400 leading-tight">{p.desc}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 dark:border-gray-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-655 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleActionLoading || rolePermissions.length === 0}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {roleActionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingRole ? 'Save Role Changes' : 'Create Role'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
