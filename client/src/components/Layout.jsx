import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ToastNotification from './ToastNotification';
import useChatStore from '../stores/chatStore';
import useSessionNotifications from '../hooks/useSessionNotifications';
import './Layout.css';

export default function Layout() {
  const connectSocket = useChatStore((s) => s.connectSocket);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('vl_sidebar_collapsed') === 'true';
    } catch { return false; }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('vl_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Connect socket once when Layout mounts (user is logged in)
  // Do NOT disconnect on unmount — socket persists for the session
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  // Listen for real-time session notifications
  useSessionNotifications();

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="layout-main">
        <Navbar onToggleSidebar={toggleSidebar} />
        <ToastNotification />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
