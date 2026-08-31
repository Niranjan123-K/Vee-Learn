import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Compass, BookOpen, Calendar,
  MessageCircle, Wallet, User
} from 'lucide-react';
import useChatStore from '../stores/chatStore';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/learning', label: 'My Learning', icon: BookOpen },
  { path: '/sessions', label: 'Sessions', icon: Calendar },
  { path: '/messages', label: 'Messages', icon: MessageCircle, hasBadge: true },
  { path: '/ledger', label: 'Ledger', icon: Wallet },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useChatStore();

  return (
    <aside className="sidebar-container">
      <div className="sidebar-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/about')} title="About Vee Learn">
        <div className="sidebar-logo-icon">
          <img src="/logo.png" alt="Vee Learn Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        </div>
        {!collapsed && (
          <span className="sidebar-logo-text hero-logo">
            Vee Learn
          </span>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/learning' && location.pathname.startsWith('/learning'));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="sidebar-link-inner">
                <span className="sidebar-link-icon">
                  <Icon size={18} />
                </span>
                {!collapsed && (
                  <span className="sidebar-link-label">
                    {item.label}
                  </span>
                )}
              </div>
              {item.hasBadge && unreadCount > 0 && (
                <span className={`sidebar-badge ${collapsed ? 'collapsed' : ''}`}>
                  {collapsed ? '' : (unreadCount > 9 ? '9+' : unreadCount)}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-content">
            <span className="text-muted" style={{fontSize: '11px'}}>© 2026 Vee Learn</span>
          </div>
        )}
      </div>
    </aside>
  );
}
