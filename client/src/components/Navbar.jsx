import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Settings, LayoutDashboard, Compass, BookOpen, Calendar, CheckCircle, XCircle, Star, Wallet, Menu, Search, Sun, Moon } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import useNotificationStore from '../stores/notificationStore';
import api from '../utils/api';
import CreditBadge from './CreditBadge';
import { getInitials, formatRelativeTime } from '../utils/formatters';
import CommandPalette from './CommandPalette';
import './Navbar.css';

const notifIcons = {
  session_new: Calendar,
  session_confirmed: CheckCircle,
  session_completed: Star,
  session_cancelled: XCircle,
};

const notifColors = {
  session_new: 'var(--info)',
  session_confirmed: 'var(--success)',
  session_completed: 'var(--warning)',
  session_cancelled: 'var(--danger)',
};

export default function Navbar({ onToggleSidebar }) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const resolveNotification = useNotificationStore((s) => s.resolveNotification);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotifClick = (notif) => {
    setShowNotifPanel(false);
    if (notif.session && notif.type !== 'session_new') {
      navigate(`/messages/${notif.session.id}`);
    } else {
      navigate('/sessions');
    }
  };

  const handleAcceptRequest = async (e, notif) => {
    e.stopPropagation();
    if (!notif.session) return;
    setLoadingAction(notif.id + 'accept');
    try {
      await api.put(`/sessions/${notif.session.id}/confirm`);
      resolveNotification(notif.id);
      setShowNotifPanel(false);
      navigate(`/messages/${notif.session.id}`);
    } catch (err) {
      console.error('Failed to accept request', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeclineRequest = async (e, notif) => {
    e.stopPropagation();
    if (!notif.session) return;
    setLoadingAction(notif.id + 'decline');
    try {
      await api.put(`/sessions/${notif.session.id}/cancel`);
      resolveNotification(notif.id);
    } catch (err) {
      console.error('Failed to decline request', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const mobileNavItems = [
    { path: '/dashboard', icon: LayoutDashboard },
    { path: '/explore', icon: Compass },
    { path: '/learning', icon: BookOpen },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar-top">
        <div className="navbar-left">
          <button className="btn-icon hide-on-mobile" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
            <Menu size={18} />
          </button>

          <div className="navbar-breadcrumb hide-on-mobile">
            <span className="text-muted" style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>Vee Learn</span>
            <span className="text-muted" style={{ margin: '0 8px' }}>/</span>
            <span className="text-primary" style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
              {location.pathname === '/dashboard' ? 'Dashboard' :
                location.pathname.startsWith('/explore') ? 'Explore' :
                  location.pathname.startsWith('/match') ? 'Matches' :
                    location.pathname.startsWith('/sessions') ? 'My Sessions' :
                      location.pathname.startsWith('/messages') ? 'Messages' :
                        location.pathname.startsWith('/ledger') ? 'Ledger' :
                          location.pathname.startsWith('/profile') ? 'Profile' : 'App'}
            </span>
          </div>

          <NavLink to="/dashboard" className="navbar-logo show-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="Logo" className="logo-dynamic" style={{ width: '24px', height: '24px' }} />
            Vee Learn
          </NavLink>
        </div>

        <div className="navbar-center hide-on-mobile">
          <div 
            className="navbar-search" 
            onClick={() => setShowCmd(true)}
            style={{ cursor: 'pointer' }}
          >
            <Search size={16} className="search-icon" />
            <div className="form-input search-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Search everywhere...</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>Ctrl</kbd>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>K</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="navbar-right">
          <button
            className="btn-icon"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{ marginRight: '4px' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <NavLink to="/ledger" style={{ textDecoration: 'none' }} className="hide-on-mobile">
            <CreditBadge amount={user?.credit_balance ?? 0} size="sm" />
          </NavLink>

          {/* Notification Bell */}
          <div className="navbar-notif-wrapper" ref={notifRef}>
            <button
              className="btn-icon"
              onClick={() => {
                setShowNotifPanel(!showNotifPanel);
                setShowDropdown(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifPanel && (
              <div className="notif-panel">
                <div className="notif-panel-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="notif-mark-read" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="notif-panel-list">
                  {notifications.length > 0 ? notifications.slice(0, 15).map((notif) => {
                    const Icon = notifIcons[notif.type] || Calendar;
                    const color = notifColors[notif.type] || 'var(--info)';
                    return (
                      <button
                        key={notif.id}
                        className={`notif-item ${!notif.read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div className="notif-item-icon" style={{ color }}>
                          <Icon size={16} />
                        </div>
                        <div className="notif-item-content">
                          <p className="notif-item-title">{notif.title}</p>
                          <p className="notif-item-msg">{notif.message}</p>
                          <span className="notif-item-time">{formatRelativeTime(notif.timestamp)}</span>

                          {notif.type === 'session_new' && notif.session?.teacher_id === user?.id && !notif.resolved && (
                            <div className="notif-handshake-actions">
                              <button
                                className="btn-success btn-xs"
                                onClick={(e) => handleAcceptRequest(e, notif)}
                                disabled={loadingAction === notif.id + 'accept'}
                                style={{ flex: 1 }}
                              >
                                {loadingAction === notif.id + 'accept' ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                className="btn-danger btn-xs"
                                onClick={(e) => handleDeclineRequest(e, notif)}
                                disabled={loadingAction === notif.id + 'decline'}
                                style={{ flex: 1 }}
                              >
                                {loadingAction === notif.id + 'decline' ? 'Declining...' : 'Decline'}
                              </button>
                            </div>
                          )}
                          {notif.resolved && (
                            <span className="notif-resolved-tag">Resolved</span>
                          )}
                        </div>
                        {!notif.read && <span className="notif-unread-dot" />}
                      </button>
                    );
                  }) : (
                    <div className="notif-empty">
                      <Bell size={24} style={{ opacity: 0.3 }} />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="navbar-user" ref={dropdownRef}>
            <button
              className="navbar-avatar-btn"
              onClick={() => { setShowDropdown(!showDropdown); setShowNotifPanel(false); }}
            >
              {user?.avatar_url || user?.avatar ? (
                <img src={user.avatar_url?.startsWith('http') ? user.avatar_url : `http://localhost:5000${user.avatar_url || user.avatar}`} alt={user.name} className="avatar avatar-sm" />
              ) : (
                <div className="avatar-fallback avatar-sm">
                  {getInitials(user?.name)}
                </div>
              )}
            </button>

            {showDropdown && (
              <div className="navbar-dropdown">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-primary)', marginBottom: '4px' }}>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)', margin: 0, color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p style={{ fontSize: 'var(--font-xs)', margin: 0, color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
                <button
                  className="navbar-dropdown-item"
                  onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                >
                  <User size={14} />
                  My Profile
                </button>
                <button
                  className="navbar-dropdown-item"
                  onClick={() => { navigate('/sessions'); setShowDropdown(false); }}
                >
                  <Settings size={14} />
                  My Sessions
                </button>
                <button
                  className="navbar-dropdown-item hide-on-desktop"
                  onClick={() => { navigate('/ledger'); setShowDropdown(false); }}
                >
                  <Wallet size={14} />
                  Ledger
                </button>
                <div className="divider-sm" />
                <button
                  className="navbar-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="navbar-bottom">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `tab-link ${isActive || (item.path === '/learning' && location.pathname.startsWith('/learning')) ? 'active' : ''}`
            }
          >
            <item.icon size={24} />
          </NavLink>
        ))}
        <NavLink
          to="/profile"
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          <User size={24} />
        </NavLink>
      </nav>
      <CommandPalette isOpen={showCmd} onClose={() => setShowCmd(false)} />
    </>
  );
}
