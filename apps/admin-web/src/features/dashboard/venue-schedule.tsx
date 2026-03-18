"use client";

import { useEffect, useState } from "react";
import { getBookings, Booking, Court } from "@/lib/api";

type Props = {
  initialCourts: Court[];
  initialDate?: string;
};

export function VenueSchedule({ initialCourts, initialDate }: Props) {
  const [selectedCourtId, setSelectedCourtId] = useState<string>(initialCourts[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      if (!selectedCourtId || !selectedDate) return;
      setLoading(true);
      try {
        const resp = await getBookings({ courtId: selectedCourtId, date: selectedDate, limit: 100 });
        setBookings(resp.items);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [selectedCourtId, selectedDate]);

  const hours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
  const rowHeight = 60; // 60px per hour

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
      <div className="card__header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingBottom: 'var(--sp-4)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 'var(--sp-4)'
      }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Venue Schedule</h3>
        
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <select 
            className="nav-pill" 
            style={{ 
              background: 'var(--surface-raised)', 
              border: '1px solid var(--border)', 
              cursor: 'pointer', 
              outline: 'none',
              padding: '4px 12px',
              fontSize: '11px',
              borderRadius: 'var(--radius-md)'
            }}
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
          >
            {initialCourts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input 
            type="date" 
            className="nav-pill"
            style={{ 
              background: 'var(--surface-raised)', 
              border: '1px solid var(--border)', 
              cursor: 'pointer', 
              outline: 'none', 
              color: 'var(--text)',
              padding: '4px 12px',
              fontSize: '11px',
              borderRadius: 'var(--radius-md)'
            }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="timeline-grid" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', marginTop: 'var(--sp-4)' }}>
        <div style={{ display: 'grid', gap: 0, marginTop: 'var(--sp-6)', borderRight: '1px solid var(--border)', paddingRight: 'var(--sp-4)' }}>
          {hours.map(h => (
            <div key={h} className="timeline-label" style={{ height: `${rowHeight}px`, display: 'flex', alignItems: 'start', justifyContent: 'flex-end', fontSize: '10px', color: 'var(--text-secondary)' }}>
              {h}:00
            </div>
          ))}
        </div>
        
        <div style={{ position: 'relative', marginTop: 'var(--sp-6)', flex: 1, minHeight: `${hours.length * rowHeight}px`, overflow: 'hidden' }}>
           {hours.map((_, i) => (
              <div key={i} className="timeline-row" style={{ height: `${rowHeight}px`, borderBottom: i === hours.length - 1 ? 'none' : '1px dashed var(--border)' }}></div>
           ))}
           
           {bookings.map((b, i) => {
              const start = new Date(b.startTime);
              const hour = start.getUTCHours();
              // Adjust for the 14:00 start in the timeline which we'll treat as UTC
              const relativeHour = hour < 14 ? (hour + 24) - 14 : hour - 14;
              const startMins = relativeHour * 60 + start.getUTCMinutes();
              const duration = b.durationMins || 60;
              const top = (startMins / 60) * rowHeight;
              const height = (duration / 60) * rowHeight;
              
              // Only filter if it's completely out of the rendered window (14h + 12h = 26h)
              if (top < 0 || top > (hours.length * rowHeight)) return null;

              return (
                <div 
                  key={b.id} 
                  className="timeline-item" 
                  style={{ 
                    position: 'absolute',
                    top: `${top}px`, 
                    height: `${height}px`,
                    left: `${(i * 15) % 60 + 5}%`,
                    width: '35%',
                    background: b.status === 'confirmed' ? 'var(--green-soft)' : b.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : b.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    borderLeft: `3px solid ${b.status === 'confirmed' ? 'var(--green-text)' : b.status === 'cancelled' ? 'var(--red-text)' : b.status === 'completed' ? 'var(--green-text) ' : 'var(--amber-text)'}`,
                    color: b.status === 'confirmed' ? 'var(--green-text)' : b.status === 'cancelled' ? 'var(--red-text)' : b.status === 'completed' ? 'var(--green-text)' : 'var(--amber-text)',
                    zIndex: 10,
                    padding: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  title={`${b.customer?.name} (${b.status})`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8, fontSize: '9px' }}>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                    <span style={{ 
                      fontSize: '8px', 
                      textTransform: 'uppercase', 
                      background: 'rgba(255,255,255,0.1)', 
                      padding: '2px 4px', 
                      borderRadius: '4px' 
                    }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.customer?.name || "Anonymous"}
                  </div>
                </div>
              );
            })}
            
            {!loading && bookings.length === 0 && (
              <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No active bookings for this slot
              </div>
            )}
        </div>
      </div>
    </article>
  );
}
