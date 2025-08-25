import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSocket from '../hooks/useSocket';

function AlertsBadge({
  userId,
  baseUrl = 'http://localhost:5000',
  onClick,
  className = '',
  showCount = true
}) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Real-time socket connection
  const { newAlerts, clearNewAlerts } = useSocket(userId, baseUrl);

  // Update unread count when new alerts arrive
  useEffect(() => {
    if (newAlerts.length > 0) {
      setUnreadCount(prev => prev + newAlerts.length);
      clearNewAlerts();
    }
  }, [newAlerts, clearNewAlerts]);

  async function fetchUnreadCount() {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const url = `${baseUrl}/api/disease/alerts?userId=${userId}`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const count = (data.alerts || []).filter(alert => !alert.read).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch alert count:', err);
    } finally {
      setLoading(false);
    }
  } useEffect(() => {
    fetchUnreadCount();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading && unreadCount === 0) {
    return (
      <button
        className={`relative p-2 rounded-lg ${className}`}
        disabled
      >
        <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative transition-colors ${className}`}
      title={t('disease_alerts') || 'Disease Alerts'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>

      {showCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-50 notification-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default AlertsBadge;
