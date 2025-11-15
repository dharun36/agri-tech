import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

// Lightweight date helpers (no external deps)
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfWeek = (date) => {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const formatISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Icon/color mapping
const TYPE_META = {
  sowing: { icon: '🌱', color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  irrigation: { icon: '💧', color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  fertilizer: { icon: '🧴', color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  fertilization: { icon: '🧴', color: 'text-orange-600', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700' },
  pesticide: { icon: '🐛', color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  pest_control: { icon: '🐛', color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  harvest: { icon: '🌾', color: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  harvesting: { icon: '🌾', color: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  planting: { icon: '🌱', color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
  pruning: { icon: '✂️', color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  soil_management: { icon: '🪴', color: 'text-emerald-700', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  disease_treatment: { icon: '🧪', color: 'text-pink-600', bg: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700' },
  weather_response: { icon: '⛅', color: 'text-sky-600', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-700' },
  general: { icon: '📝', color: 'text-gray-700', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' },
};

const getTypeKey = (task) => (task.type || task.category || 'general');

const getTypeMeta = (task) => TYPE_META[getTypeKey(task)] || TYPE_META.general;

const Legend = () => {
  const items = [
    { key: 'sowing', label: 'Sowing' },
    { key: 'irrigation', label: 'Irrigation' },
    { key: 'fertilizer', label: 'Fertilizer' },
    { key: 'pesticide', label: 'Pesticide' },
    { key: 'harvest', label: 'Harvest' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 p-2 rounded-md bg-white/60">
      {items.map(({ key, label }) => {
        const m = TYPE_META[key];
        return (
          <div key={key} className="flex items-center gap-1 text-sm">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${m.bg} ${m.color}`}>{m.icon}</span>
            <span className="text-gray-700">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Calendar component
const Calendar = ({ initialDate = new Date(), fetchUrl = '/api/tasks' }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSmall, setIsSmall] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', status: 'all', field: 'all' });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Responsive: detect small screens and switch to week view
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsSmall(e.matches);
    setIsSmall(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const parseDueDate = (t) => new Date(t.dueDate || t.date || t.due || t.scheduledAt || t.scheduled || t.start);

  const normalizedTasks = useMemo(() => {
    // Normalize fields and filter by current visible range
    return tasks
      .map((t) => ({
        ...t,
        _id: t._id || t.id,
        done: typeof t.done === 'boolean' ? t.done : (t.status ? t.status === 'done' : false),
        due: parseDueDate(t),
        typeKey: getTypeKey(t),
      }))
      .filter((t) => !isNaN(t.due));
  }, [tasks]);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(new Date()), []);

  const visibleStart = useMemo(() => (isSmall ? weekStart : gridStart), [isSmall, weekStart, gridStart]);
  const visibleEnd = useMemo(() => (isSmall ? weekEnd : gridEnd), [isSmall, weekEnd, gridEnd]);

  const days = useMemo(() => {
    const res = [];
    const d = new Date(visibleStart);
    while (d <= visibleEnd) {
      res.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return res;
  }, [visibleStart, visibleEnd]);

  const tasksByDate = useMemo(() => {
    const map = new Map();
    for (const day of days) {
      map.set(formatISODate(day), []);
    }

    for (const t of normalizedTasks) {
      const key = formatISODate(t.due);
      if (!map.has(key)) continue;

      // Apply filters
      if (filters.type !== 'all' && getTypeKey(t) !== filters.type) continue;
      if (filters.status !== 'all') {
        const stat = t.done ? 'done' : (t.status || 'pending');
        if (stat !== filters.status) continue;
      }
      if (filters.field !== 'all') {
        const fieldName = t.field || t.fieldName || t.location || t.cropField || '';
        if (String(fieldName) !== String(filters.field)) continue;
      }

      map.get(key).push(t);
    }

    // Sort tasks within a day by priority then title
    for (const [k, list] of map) {
      list.sort((a, b) => {
        const pa = (a.priority || '').toString();
        const pb = (b.priority || '').toString();
        if (pa === pb) return (a.title || '').localeCompare(b.title || '');
        return pa.localeCompare(pb);
      });
    }

    return map;
  }, [normalizedTasks, days, filters]);

  const uniqueFields = useMemo(() => {
    const s = new Set();
    normalizedTasks.forEach((t) => {
      const field = t.field || t.fieldName || t.location || t.cropField;
      if (field) s.add(field);
    });
    return Array.from(s);
  }, [normalizedTasks]);

  const uniqueTypes = useMemo(() => {
    const s = new Set();
    normalizedTasks.forEach((t) => s.add(getTypeKey(t)));
    return Array.from(s);
  }, [normalizedTasks]);

  const lastRangeRef = React.useRef('');
  const fetchTasks = useCallback(async (rangeStart, rangeEnd) => {
    setLoading(true);
    setError(null);
    try {
      // Avoid duplicate requests when the date range hasn't changed
      const key = `${new Date(rangeStart).toISOString()}_${new Date(rangeEnd).toISOString()}`;
      if (lastRangeRef.current === key) {
        setLoading(false);
        return;
      }
      lastRangeRef.current = key;
      const token = localStorage.getItem('token');
      // Build URL and include date range for efficiency if targeting /api/tasks
      const base = `${API_BASE_URL}${fetchUrl.startsWith('/') ? fetchUrl : `/${fetchUrl}`}`;
      const params = new URLSearchParams();
      if (base.endsWith('/api/tasks') || base.endsWith('/api/tasks/')) {
        if (rangeStart) params.set('dueAfter', new Date(rangeStart).toISOString());
        if (rangeEnd) params.set('dueBefore', new Date(rangeEnd).toISOString());
        // Fetch a generous page to cover month/week
        params.set('limit', '500');
      }
      const url = params.toString() ? `${base}?${params.toString()}` : base;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.tasks || data.items || data.data || []);
      setTasks(arr);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  // Fetch tasks when the visible range changes (month/week) or on first mount
  useEffect(() => {
    fetchTasks(visibleStart, visibleEnd);
  }, [fetchTasks, visibleStart, visibleEnd]);

  const markDone = useCallback(async (task) => {
    const id = task._id || task.id;
    if (!id) return;
    const token = localStorage.getItem('token');

    // try POST /tasks/:id/done (AgriAssist style) then fallback to PUT /tasks/:id/status
    const tryRequests = [
      {
        method: 'POST',
        url: `${API_BASE_URL}/api/tasks/${id}/done`,
        body: null,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      {
        method: 'PUT',
        url: `${API_BASE_URL}/api/tasks/${id}/status`,
        body: JSON.stringify({ status: 'done' }),
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
      }
    ];

    let ok = false;
    for (const req of tryRequests) {
      try {
        const res = await fetch(req.url, { method: req.method, headers: req.headers, body: req.body });
        if (res.ok) { ok = true; break; }
      } catch (e) {
        // continue to next attempt
      }
    }

    if (ok) {
      // Update local state
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id ? {
        ...t,
        done: true,
        status: 'done',
        completedDate: new Date().toISOString(),
      } : t)));
    } else {
      setError('Failed to mark task as done');
    }
  }, []);

  // UI helpers
  const DayHeader = () => (
    <div className="grid grid-cols-7 text-xs font-semibold text-gray-600">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="px-2 py-1 text-center">{d}</div>
      ))}
    </div>
  );

  const DayCell = ({ day }) => {
    const key = formatISODate(day);
    const inMonth = day.getMonth() === currentMonth.getMonth();
    const today = isSameDay(day, new Date());
    const dayTasks = tasksByDate.get(key) || [];
    const maxItems = isSmall ? 2 : 3;
    const visibleTasks = dayTasks.slice(0, maxItems);
    const hiddenCount = Math.max(0, dayTasks.length - visibleTasks.length);

    return (
      <div className={`border p-1 min-h-[110px] overflow-hidden rounded-md hover:shadow-sm transition ${inMonth ? 'bg-white' : 'bg-gray-50'} ${today ? 'ring-2 ring-green-500' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${inMonth ? 'text-gray-800' : 'text-gray-400'}`}>{day.getDate()}</span>
            {dayTasks.length > 0 && (
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{dayTasks.length}</span>
            )}
          </div>
          {today && <span className="text-[10px] uppercase text-green-600 font-bold">Today</span>}
        </div>
        <div className="space-y-1 max-h-24 overflow-hidden pr-1">
          {visibleTasks.map((t) => {
            const m = getTypeMeta(t);
            const tooltip = [t.field || t.fieldName, t.crop || t.cropName].filter(Boolean).join(' · ');
            const isDone = t.done || t.status === 'done';
            return (
              <div key={t._id || t.id}
                title={tooltip}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${m.bg} ${isDone ? 'opacity-50 line-through' : ''}`}>
                <span className={`${m.color}`}>{m.icon}</span>
                <span className="flex-1 truncate text-gray-800">{t.title || t.name || 'Task'}</span>
                {!isDone ? (
                  <button
                    type="button"
                    onClick={() => markDone(t)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${m.badge} hover:opacity-90`}
                    aria-label="Mark done"
                  >Done</button>
                ) : (
                  <span className="text-green-700">✅</span>
                )}
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => { setSelectedDay(day); setShowDayModal(true); }}
              className="w-full text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded"
            >
              +{hiddenCount} more
            </button>
          )}
        </div>
      </div>
    );
  };

  const CalendarGrid = () => (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => <DayCell key={d.toISOString()} day={d} />)}
    </div>
  );

  const MonthNav = () => (
    <div className="flex items-center justify-between mb-3 bg-gradient-to-r from-green-50 to-teal-50 p-2 rounded">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
        >◀</button>
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth(startOfMonth(new Date()))}
        >Today</button>
        <button
          type="button"
          className="px-2 py-1 rounded border hover:bg-gray-50"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >▶</button>
        <div className="ml-3">
          <div className="text-lg font-semibold text-gray-800">
            {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-gray-500">
            {visibleStart.toLocaleDateString()} – {visibleEnd.toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Filters */}
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="skipped">Skipped</option>
        </select>

        <select
          value={filters.field}
          onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All fields</option>
          {uniqueFields.map((f) => (
            <option key={String(f)} value={String(f)}>{String(f)}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Page topic/title */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaCalendarAlt className="text-green-600" />
          Farm Calendar
        </h1>
      </div>

      <div className="mb-3">
        <Legend />
      </div>

      <MonthNav />

      {/* Headers */}
      <DayHeader />

      {/* Grid */}
      <div className="mt-1">
        {loading && (
          <div className="text-center text-gray-500 py-6">Loading tasks…</div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 p-2 rounded mb-2">{error}</div>
        )}
        {!loading && (
          <CalendarGrid />)
        }
      </div>

      {/* Day modal for showing all tasks of a date */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDayModal(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-gray-800">{selectedDay.toLocaleDateString()}</div>
                <div className="text-xs text-gray-500">All events</div>
              </div>
              <button type="button" className="px-2 py-1 text-sm rounded border hover:bg-gray-50" onClick={() => setShowDayModal(false)}>Close</button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {(tasksByDate.get(formatISODate(selectedDay)) || []).map((t) => {
                const m = getTypeMeta(t);
                const isDone = t.done || t.status === 'done';
                const tooltip = [t.field || t.fieldName, t.crop || t.cropName].filter(Boolean).join(' · ');
                return (
                  <div key={t._id || t.id} title={tooltip} className={`flex items-center gap-2 p-2 rounded ${m.bg} ${isDone ? 'opacity-50 line-through' : ''}`}>
                    <span className={`${m.color}`}>{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{t.title || t.name || 'Task'}</div>
                      <div className="text-xs text-gray-600 truncate">{t.description || ''}</div>
                    </div>
                    {!isDone ? (
                      <button type="button" onClick={() => markDone(t)} className={`text-[11px] px-2 py-1 rounded ${m.badge} hover:opacity-90`}>Done</button>
                    ) : (
                      <span className="text-green-700">✅</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
