import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ToastNotification from './ToastNotification';
import useChatStore from '../stores/chatStore';
import useSessionNotifications from '../hooks/useSessionNotifications';
import './Layout.css';

export default function Layout() {
  const connectSocket = useChatStore((s) => s.connectSocket);

  // Connect socket once when Layout mounts (user is logged in)
  // Do NOT disconnect on unmount — socket persists for the session
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  // Listen for real-time session notifications
  useSessionNotifications();

  return (
    <div className="layout">
      <Navbar />
      <ToastNotification />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}
