import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count every 30s
  useEffect(() => {
    const fetchCount = () => {
      api.getUnreadCount().then(d => setUnreadCount(d.count)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleOpen = async () => {
    if (!open) {
      setLoading(true);
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch {}
      setLoading(false);
    }
    setOpen(!open);
  };

  const handleClick = async (notif: any) => {
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const typeIcons: Record<string, string> = {
    NEW_APPLICATION: '📩',
    STATUS_CHANGE: '🔄',
    INTERVIEW_SCHEDULED: '🎯',
    INTERVIEW_CANCELLED: '❌',
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notif-bell-wrapper" ref={ref}>
      <button className="notif-bell-btn" onClick={toggleOpen} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown fade-in">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading ? (
              <div className="notif-empty pulse">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet</div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'notif-unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-item-icon">{typeIcons[n.type] || '🔔'}</span>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-message">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
