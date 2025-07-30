import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function useDiseaseAlerts(userId) {
  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/disease/alerts?userId=${userId}`);
        const data = await res.json();
        if (!ignore && data.alerts && data.alerts.length > 0) {
          data.alerts.forEach(alert => {
            toast.warn(`Disease Alert: ${alert.disease} detected nearby!`, { autoClose: 10000 });
          });
          // Mark as read
          await fetch('http://localhost:5000/api/disease/alerts/read', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
        }
      } catch {}
    };
    fetchAlerts();
    // Optionally poll every 60s
    const interval = setInterval(fetchAlerts, 60000);
    return () => { ignore = true; clearInterval(interval); };
  }, [userId]);
}
