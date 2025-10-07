// src/components/CalendarPreview.tsx
import React from "react";
import { useGoogleAuth } from "../contexts/GoogleAuthContext";

const formatDate = (dt: any) => {
  if (!dt) return "";
  const d = dt.dateTime ? new Date(dt.dateTime) : new Date(dt.date);
  return d.toLocaleString();
};

export default function CalendarPreview() {
  const { gapiReady, isSignedIn, signIn, signOut, calendars, events, selectedCalendarId, selectCalendar } = useGoogleAuth();

  if (!gapiReady) return <div>Loading Google API...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      {!isSignedIn ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={signIn} style={primaryBtn}>Connect Google Calendar</button>
          <p style={{ color: "#666", marginTop: 8 }}>You will be asked to grant read-only access to your calendars.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <strong>Connected</strong>
              <div style={{ fontSize: 12, color: "#666" }}>{selectedCalendarId}</div>
            </div>
            <div>
              <button onClick={signOut} style={{ ...primaryBtn, background: "#E53E3E" }}>Sign out</button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Select calendar to preview</label>
            <select
              value={selectedCalendarId}
              onChange={(e) => selectCalendar(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 8 }}
            >
              {calendars.map((c: any) => (
                <option key={c.id} value={c.id}>{c.summary || c.id}</option>
              ))}
            </select>
          </div>

          <h3 style={{ marginTop: 10 }}>Upcoming events</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {events.length === 0 ? <li>No events found</li> : events.map((ev: any) => (
              <li key={ev.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ fontWeight: 700 }}>{ev.summary || "(no title)"}</div>
                <div style={{ color: "#444", fontSize: 13 }}>{formatDate(ev.start)} — {formatDate(ev.end)}</div>
                {ev.location && <div style={{ fontSize: 13 }}>{ev.location}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: "#2563EB",
  color: "#fff",
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};