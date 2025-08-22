import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSocket from '../hooks/useSocket';

// Utility functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getSeverityColor = (disease, confidence = 0.5) => {
  if (!disease || disease === 'undefined' || disease.toLowerCase().includes('unknown')) {
    return 'bg-gray-500';
  }
  if (disease.toLowerCase().includes('healthy') || disease.toLowerCase().includes('ஆரோக்கியம்')) {
    return 'bg-green-500';
  }
  if (confidence > 0.8 || disease.toLowerCase().includes('blight') || disease.toLowerCase().includes('rot')) {
    return 'bg-red-500';
  }
  return 'bg-orange-500';
};

const groupAlerts = (alerts) => {
  const groups = {};
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours

  alerts.forEach(alert => {
    const key = `${alert.disease}_${alert.location.coordinates.join(',')}_${Math.floor(new Date(alert.createdAt).getTime() / timeWindow)}`;

    if (!groups[key]) {
      groups[key] = {
        ...alert,
        count: 1,
        latestTime: alert.createdAt,
        alerts: [alert]
      };
    } else {
      groups[key].count++;
      groups[key].alerts.push(alert);
      if (new Date(alert.createdAt) > new Date(groups[key].latestTime)) {
        groups[key].latestTime = alert.createdAt;
      }
    }
  });

  return Object.values(groups).sort((a, b) => new Date(b.latestTime) - new Date(a.latestTime));
};

function DiseaseAlerts({
  userId,
  baseUrl = 'http://localhost:5000',
  showGrouped = true,
  maxItems = 10,
  showBadge = true
}) {
  console.log('🎯 DiseaseAlerts - Component initialized with userId:', userId);

  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Real-time socket connection
  const { isConnected, newAlerts, clearNewAlerts } = useSocket(userId, baseUrl);

  // Merge new real-time alerts with existing alerts
  useEffect(() => {
    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existing = prev.map(a => a._id);
        const newOnes = newAlerts.filter(alert => !existing.includes(alert._id));
        return [...newOnes, ...prev];
      });
      clearNewAlerts();
    }
  }, [newAlerts, clearNewAlerts]);

  const groupedAlerts = useMemo(() => {
    if (!showGrouped) return alerts.slice(0, maxItems * currentPage);
    return groupAlerts(alerts).slice(0, maxItems * currentPage);
  }, [alerts, showGrouped, maxItems, currentPage]);

  const unreadCount = alerts.filter(a => !a.read).length;

  async function loadAlerts() {
    if (!userId) {
      console.log('❌ DiseaseAlerts - No userId provided');
      return;
    }

    console.log('🔍 DiseaseAlerts - Loading alerts for userId:', userId);
    setLoading(true);
    setError(null);

    try {
      const url = `${baseUrl}/api/disease/alerts?userId=${userId}`;
      console.log('📡 DiseaseAlerts - Fetching from:', url);

      const res = await fetch(url);
      console.log('📡 DiseaseAlerts - Response status:', res.status);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log('📊 DiseaseAlerts - Received data:', data);
      console.log('📊 DiseaseAlerts - Alerts count:', data.alerts?.length || 0);

      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('❌ DiseaseAlerts - Failed loading alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (!userId || alerts.length === 0) return;

    try {
      const res = await fetch(`${baseUrl}/api/disease/alerts/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
      } else {
        console.error('Failed to mark alerts as read');
      }
    } catch (err) {
      console.error('Error marking alerts as read:', err);
    }
  }

  async function markSingleRead(alertId) {
    // Update UI optimistically
    setAlerts(prev => prev.map(alert =>
      alert._id === alertId ? { ...alert, read: true } : alert
    ));

    // Note: You may want to add a single-alert read endpoint on the server
    // For now, this just updates the UI
  }

  const openMapLocation = (coordinates) => {
    const [lng, lat] = coordinates;
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(mapUrl, '_blank');
  };

  const getDisplayText = (disease, description) => {
    if (!disease || disease === 'undefined') {
      return {
        title: t('unknown_disease') || 'Unknown / Needs Review',
        subtitle: description || t('no_description') || 'No description available'
      };
    }

    return {
      title: disease,
      subtitle: truncateText(description || t('no_description') || 'No description available')
    };
  };

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  // Load more functionality
  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const hasMore = showGrouped
    ? groupAlerts(alerts).length > maxItems * currentPage
    : alerts.length > maxItems * currentPage;

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t('loading') || 'Loading alerts...'}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {t('disease_alerts') || 'Disease Alerts'}
          </h2>
          {showBadge && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
          {isConnected && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {t('live') || 'Live'}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? (t('refreshing') || 'Refreshing...') : (t('refresh') || 'Refresh')}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('mark_all_read') || 'Mark All Read'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                {t('error_loading_alerts') || 'Error loading alerts'}: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {groupedAlerts.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-lg font-medium">{t('no_alerts') || 'No alerts found'}</p>
            <p className="mt-1 text-sm">{t('no_alerts_description') || 'Disease alerts will appear here when detected in your area.'}</p>
          </div>
        ) : (
          groupedAlerts.map((alertGroup) => {
            const displayData = getDisplayText(alertGroup.disease, alertGroup.description);
            const isExpanded = expandedAlert === alertGroup._id;
            const isUnread = !alertGroup.read;

            return (
              <div
                key={alertGroup._id}
                className={`p-6 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getSeverityColor(alertGroup.disease)}`}>
                        {alertGroup.disease === 'undefined' ? (t('unknown') || 'Unknown') : displayData.title}
                      </span>

                      {showGrouped && alertGroup.count > 1 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                          {alertGroup.count} {t('detections') || 'detections'}
                        </span>
                      )}

                      {isUnread && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          {t('unread') || 'Unread'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {displayData.title}
                      {showGrouped && alertGroup.count > 1 && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          — {alertGroup.count} {t('detections_in_24h') || 'detections in last 24h'}
                        </span>
                      )}
                    </h3>

                    <p className="text-gray-600 mb-3">
                      {displayData.subtitle}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {formatDate(showGrouped ? alertGroup.latestTime : alertGroup.createdAt)}
                      </span>

                      <span>
                        📍 {t('location') || 'Location'}: {alertGroup.location.coordinates[1].toFixed(4)}, {alertGroup.location.coordinates[0].toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => setExpandedAlert(isExpanded ? null : alertGroup._id)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      {isExpanded ? (t('hide_details') || 'Hide') : (t('view_details') || 'Details')}
                    </button>

                    <button
                      onClick={() => openMapLocation(alertGroup.location.coordinates)}
                      className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                    >
                      📍 {t('open_map') || 'Map'}
                    </button>

                    {isUnread && (
                      <button
                        onClick={() => markSingleRead(alertGroup._id)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        ✓ {t('mark_read') || 'Mark Read'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>{t('full_description') || 'Full Description'}:</strong>
                        <p className="mt-1 text-gray-700">{alertGroup.description || t('no_description') || 'No description available'}</p>
                      </div>

                      <div>
                        <strong>{t('recommended_actions') || 'Recommended Actions'}:</strong>
                        <ul className="mt-1 space-y-1 text-gray-700">
                          <li>• <a href="#" className="text-blue-600 hover:underline">{t('view_treatment_guide') || 'View treatment guide'}</a></li>
                          <li>• <a href="#" className="text-blue-600 hover:underline">{t('contact_extension_agent') || 'Contact local extension agent'}</a></li>
                          <li>• <a href="#" className="text-blue-600 hover:underline">{t('schedule_inspection') || 'Schedule field inspection'}</a></li>
                        </ul>
                      </div>

                      {showGrouped && alertGroup.count > 1 && (
                        <div className="md:col-span-2">
                          <strong>{t('all_detections') || 'All Detections'} ({alertGroup.count}):</strong>
                          <div className="mt-2 space-y-1">
                            {alertGroup.alerts.map((alert, idx) => (
                              <div key={alert._id} className="text-xs text-gray-600">
                                {idx + 1}. {formatDate(alert.createdAt)} - {alert.read ? '✓ Read' : '● Unread'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? (t('loading') || 'Loading...') : (t('load_more') || 'Load More')}
          </button>
        </div>
      )}
    </div>
  );
}

export default DiseaseAlerts;
