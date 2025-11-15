import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function NotificationPermission() {
  const { t } = useTranslation();
  const [permissionState, setPermissionState] = useState('default');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);

    // Show banner only if permission is not granted and not denied
    if (currentPermission !== 'granted' && currentPermission !== 'denied') {
      // Wait a moment before showing the banner to not interrupt initial app load
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        // Send a test notification
        const notification = new Notification(t('notificationTest.title'), {
          body: t('notificationTest.body'),
          icon: '/favicon.ico',
        });

        // Close notification after 3 seconds
        setTimeout(() => notification.close(), 3000);
      }

      // Hide banner regardless of the answer
      setShowBanner(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // Save preference in localStorage to not show again in this session
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't show if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (dismissed === 'true') {
      setShowBanner(false);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {t('notifications.enableTitle')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('notifications.enableDescription')}
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t('notifications.enable')}
            </button>
            <button
              onClick={dismissBanner}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t('notifications.later')}
            </button>
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <span className="sr-only">{t('common.close')}</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default NotificationPermission;
