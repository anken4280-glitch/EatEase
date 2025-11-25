import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_change': return '🔔';
      case 'promotion': return '🎯';
      case 'system': return 'ℹ️';
      default: return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-top">
          <h2>🔔 Notifications</h2>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount} unread</span>
          )}
        </div>
        <p>Stay updated with your favorite restaurants</p>
        
        {notifications.length > 0 && unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll get notified about crowd status changes and promotions</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <p className="message">{notification.message}</p>
                <span className="time">
                  {new Date(notification.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </span>
              </div>

              {!notification.isRead && (
                <button 
                  className="mark-read-btn"
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}