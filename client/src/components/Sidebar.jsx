import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Compass, Users, Calendar,
  MessageCircle, Wallet, User, ChevronLeft, Sparkles
} from 'lucide-react';
import useChatStore from '../stores/chatStore';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/explore', label: 'Explore Skills', icon: Compass },
  { path: '/match/all', label: 'Find a Match', icon: Users },
  { path: '/sessions', label: 'My Sessions', icon: Calendar },
  { path: '/messages', label: 'Messages', icon: MessageCircle, hasBadge: true },
  { path: '/ledger', label: 'Credit Ledger', icon: Wallet },
  { path: '/profile', label: 'My Profile', icon: User },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { unreadCount } = useChatStore();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={22} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="sidebar-logo-text gradient-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Vee Learn
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          <ChevronLeft size={18} className={`sidebar-toggle-icon ${collapsed ? 'rotated' : ''}`} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/match/all' && location.pathname.startsWith('/match'));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  className="sidebar-active-indicator"
                  layoutId="sidebar-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="sidebar-link-icon">
                <Icon size={20} />
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="sidebar-link-label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.hasBadge && unreadCount > 0 && (
                <span className="sidebar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <motion.div
            className="sidebar-footer-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="sidebar-footer-text">Share skills, earn time credits</p>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
