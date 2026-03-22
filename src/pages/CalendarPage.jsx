import { useState, useMemo } from 'react';
import { getOutfitLog } from '../services/storage';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import './CalendarPage.css';

const EVENT_LABELS = {
  work: 'עבודה',
  casual: 'יומיומי',
  date: 'דייט',
  bar: 'בר',
  friday: 'שישי',
  sport: 'ספורט',
};

export default function CalendarPage({ showToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('calendar'); // calendar | feed
  const outfitLog = getOutfitLog();

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const getLogForDate = (date) => {
    return outfitLog.filter(entry => isSameDay(new Date(entry.date), date));
  };

  const selectedDayLog = selectedDate ? getLogForDate(selectedDate) : [];

  const sortedLog = useMemo(() => {
    return [...outfitLog].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [outfitLog]);

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>היומן שלי</h1>
        <div className="view-toggle">
          <button
            className={view === 'calendar' ? 'active' : ''}
            onClick={() => setView('calendar')}
          >
            לוח שנה
          </button>
          <button
            className={view === 'feed' ? 'active' : ''}
            onClick={() => setView('feed')}
          >
            פיד
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <>
          <div className="month-nav">
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight size={20} />
            </button>
            <h3>{format(currentMonth, 'MMMM yyyy', { locale: he })}</h3>
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="calendar-grid">
            {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(day => (
              <div key={day} className="day-header">{day}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty" />
            ))}
            {daysInMonth.map(day => {
              const dayLog = getLogForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayLog.length > 0 ? 'has-log' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="day-number">{format(day, 'd')}</span>
                  {dayLog.length > 0 && (
                    <div className="day-dots">
                      {dayLog.slice(0, 3).map((_, i) => (
                        <span key={i} className="day-dot" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="day-detail">
              <h4>{format(selectedDate, 'EEEE, d בMMMM', { locale: he })}</h4>
              {selectedDayLog.length === 0 ? (
                <p className="no-entries">אין רשומות ליום הזה</p>
              ) : (
                <div className="day-entries">
                  {selectedDayLog.map(entry => (
                    <div key={entry.id} className="log-entry">
                      <span className="log-event">
                        {EVENT_LABELS[entry.event] || entry.event || 'כללי'}
                      </span>
                      <span className="log-items">
                        {(entry.items || []).length} פריטים
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="feed-view">
          {sortedLog.length === 0 ? (
            <div className="feed-empty">
              <CalendarIcon size={48} />
              <p>עדיין אין לוקים ביומן</p>
              <p className="feed-hint">לחצ/י "לבשתי!" כדי לשמור לוקים כאן</p>
            </div>
          ) : (
            <div className="feed-list">
              {sortedLog.map(entry => (
                <div key={entry.id} className="feed-entry">
                  <div className="feed-date">
                    <span className="feed-day">{format(new Date(entry.date), 'd')}</span>
                    <span className="feed-month">{format(new Date(entry.date), 'MMM', { locale: he })}</span>
                  </div>
                  <div className="feed-content">
                    <span className="feed-event">
                      {EVENT_LABELS[entry.event] || entry.event || 'כללי'}
                    </span>
                    <span className="feed-items-count">
                      {(entry.items || []).length} פריטים בלוק
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
