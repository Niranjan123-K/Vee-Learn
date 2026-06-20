import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Settings, LayoutDashboard, Compass, Users, Calendar, CheckCircle, XCircle, Star } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import CreditBadge from './CreditBadge';
import { getInitials, formatRelativeTime } from '../utils/formatters';
import './Navbar.css';

const notifIcons = {
  session_new: Calendar,
  session_confirmed: CheckCircle,
  session_completed: Star,
  session_cancelled: XCircle,
};

const notifColors = {
  session_new: '#818cf8',
  session_confirmed: '#22c55e',
  session_completed: '#f59e0b',
  session_cancelled: '#ef4444',
};

export default function Navbar() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotifClick = (notif) => {
    setShowNotifPanel(false);
    navigate('/sessions');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/match/all', label: 'Matches', icon: Users },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar-top">
        <div className="navbar-left">
          <NavLink to="/about" className="navbar-logo">
            Vee Learn
          </NavLink>
          <div className="navbar-desktop-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `navbar-link ${isActive || (item.path === '/match/all' && location.pathname.startsWith('/match')) ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="navbar-right">
          <CreditBadge amount={user?.credit_balance ?? 0} size="sm" className="hide-on-mobile" />

          {/* Notification Bell */}
          <div className="navbar-notif-wrapper" ref={notifRef}>
            <button
              className="navbar-icon-btn"
              onClick={() => {
                setShowNotifPanel(!showNotifPanel);
                setShowDropdown(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
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
                    const color = notifColors[notif.type] || '#818cf8';
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

          <div className="navbar-user hide-on-mobile" ref={dropdownRef}>
            <button
              className="navbar-avatar-btn"
              onClick={() => { setShowDropdown(!showDropdown); setShowNotifPanel(false); }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar avatar-sm" />
              ) : (
                <div className="avatar-fallback avatar-sm">
                  {getInitials(user?.name)}
                </div>
              )}
            </button>

            {showDropdown && (
              <div className="navbar-dropdown">
                <button
                  className="navbar-dropdown-item"
                  onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                >
                  <User size={16} />
                  My Profile
                </button>
                <button
                  className="navbar-dropdown-item"
                  onClick={() => { navigate('/sessions'); setShowDropdown(false); }}
                >
                  <Settings size={16} />
                  My Sessions
                </button>
                <div className="divider" style={{ margin: '4px 0' }} />
                <button
                  className="navbar-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="navbar-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `tab-link ${isActive || (item.path === '/match/all' && location.pathname.startsWith('/match')) ? 'active' : ''}`
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
    </>
  );
}
