import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';
import {
  Users,
  LayoutDashboard, Package, Image as ImageIcon, FolderOpen, ClipboardList,
  ShoppingCart, BarChart3, LogOut, QrCode as QrIcon, Menu, X
} from 'lucide-react';

const adminNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
  { to: '/catalog', icon: ImageIcon, label: 'Catalog', adminOnly: false },
  { to: '/inventory', icon: Package, label: 'Inventory', adminOnly: true },
  { to: '/categories', icon: FolderOpen, label: 'Categories', adminOnly: true },
  { to: '/transactions', icon: ShoppingCart, label: 'Transactions', adminOnly: true },
  { to: '/reports', icon: BarChart3, label: 'Analytics', adminOnly: true },
  { to: '/qrcode', icon: QrIcon, label: 'QRIS', adminOnly: false },
  { to: '/contact', icon: Users, label: 'Contact Person', adminOnly: false },
];

const guestNavItems = [
  { to: '/catalog', icon: ImageIcon, label: 'Catalog', adminOnly: false },
  { to: '/contact', icon: Users, label: 'Contact Person', adminOnly: false },
  { to: '/qrcode', icon: QrIcon, label: 'QRIS', adminOnly: false },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeNavItems = user ? adminNavItems : guestNavItems;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileForm, setProfileForm] = useState({ email: user?.email || '', oldPassword: '', newPassword: '', confirmPassword: '' });
  const [modalMessage, setModalMessage] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setModalMessage('');
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setModalMessage('Password baru tidak cocok');
      return;
    }
    if (!profileForm.oldPassword) {
      setModalMessage('Password lama harus diisi');
      return;
    }
    try {
      await api.put('/auth/profile', {
        email: profileForm.email,
        oldPassword: profileForm.oldPassword,
        newPassword: profileForm.newPassword || undefined,
      });
      setModalMessage('Profil berhasil diupdate. Mohon login ulang menggunakan email/pass baru jika diubah.');
      setTimeout(() => {
        setShowProfile(false);
        handleLogout();
      }, 2000);
    } catch (err) {
      setModalMessage(err.response?.data?.message || 'Gagal mengubah profil');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/catalog');
  };

  return (
    <div className="flex h-screen relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#12122a] border-r border-[#2d2d4a] flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-[#2d2d4a] md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <img src="/logoShop.png" alt="DigiShop Logo" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-bold text-white tracking-wide">DigiShop</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {window.location.pathname !== '/login' && activeNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-slate-400 hover:bg-[#1a1a2e] hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#2d2d4a]">
          {user ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg bg-[#12122a] border border-[#2d2d4a] text-slate-400 hover:bg-violet-600/20 hover:text-violet-400 hover:border-violet-500/30 transition-all font-medium text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4 rotate-180" />
              Admin Mode?
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className={`h-14 bg-[#12122a] border-b border-[#2d2d4a] flex items-center justify-between px-4 md:px-6 shrink-0 ${!user ? 'md:hidden' : ''}`}>
          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center flex-1">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white p-1">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Center Logo */}
          <div className="md:hidden font-bold text-lg text-white">
            DigiShop
          </div>

          {/* Profile (Desktop & Mobile Right) */}
          <div className="flex items-center justify-end flex-1 md:w-full">
            {user ? (
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 hover:bg-[#1a1a2e] p-1 pr-2 md:p-1.5 md:pr-3 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm text-left hidden md:block">
                  <p className="text-slate-200 font-medium">{user?.name}</p>
                  <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
                </div>
              </button>
            ) : (
              // Empty div on right for spacing balance when no user in mobile
              <div className="w-8 md:hidden"></div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0f0f14]">
          <Outlet />
        </main>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12122a] border border-[#2d2d4a] rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[#2d2d4a] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Profile</h2>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
              {modalMessage && (
                <div className={`p-3 rounded-lg text-sm ${modalMessage.includes('berhasil') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {modalMessage}
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current / New Email *</label>
                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required
                  className="w-full bg-[#1a1a2e] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Password *</label>
                <input type="password" value={profileForm.oldPassword} onChange={(e) => setProfileForm({ ...profileForm, oldPassword: e.target.value })} required
                  className="w-full bg-[#1a1a2e] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">New Password</label>
                  <input type="password" value={profileForm.newPassword} onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    className="w-full bg-[#1a1a2e] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
                  <input type="password" value={profileForm.confirmPassword} onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    className="w-full bg-[#1a1a2e] border border-[#2d2d4a] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProfile(false)}
                  className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-sm py-2.5 rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2.5 rounded-lg transition-colors cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12122a] border border-[#2d2d4a] rounded-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <LogOut className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Logout Confirmation</h2>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-[#1a1a2e] hover:bg-[#2d2d4a] text-slate-300 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


