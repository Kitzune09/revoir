// src/contexts/GoogleAuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type CalendarItem = any;
type EventItem = any;

interface GoogleAuthContextType {
  gapiReady: boolean;
  isSignedIn: boolean;
  calendars: CalendarItem[];
  events: EventItem[];
  selectedCalendarId?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  selectCalendar: (calendarId: string) => Promise<void>;
  reloadEvents: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider = ({ children }: { children: ReactNode }) => {
  const [gapiReady, setGapiReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | undefined>(undefined);

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
  const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

  // wait until the script has defined window.gapi
  const waitForGapi = () =>
    new Promise<any>((resolve, reject) => {
      const g = (window as any).gapi;
      if (g) return resolve(g);
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if ((window as any).gapi) {
          clearInterval(t);
          resolve((window as any).gapi);
        } else if (tries > 200) { // ~10s
          clearInterval(t);
          reject(new Error("gapi failed to load"));
        }
      }, 50);
    });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const gapi = await waitForGapi();
        // load client:auth2
        await new Promise((resolve, reject) => {
          gapi.load("client:auth2", {
            callback: resolve,
            onerror: () => reject(new Error("gapi.load failed")),
            timeout: 5000,
            ontimeout: () => reject(new Error("gapi.load timed out")),
          });
        });

        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });

        const auth = gapi.auth2.getAuthInstance();
        if (!auth) throw new Error("gapi.auth2 init failed");

        if (!mounted) return;
        setGapiReady(true);
        setIsSignedIn(auth.isSignedIn.get());

        // listen for sign-in changes
        auth.isSignedIn.listen(async (signedIn: boolean) => {
          setIsSignedIn(signedIn);
          if (signedIn) {
            await loadCalendars();
          } else {
            setCalendars([]);
            setEvents([]);
            setSelectedCalendarId(undefined);
          }
        });

        // if already signed in (persisted), load calendars
        if (auth.isSignedIn.get()) {
          await loadCalendars();
        }
      } catch (err) {
        console.error("gapi init error:", err);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    const gapi = (window as any).gapi;
    const auth = gapi?.auth2?.getAuthInstance();
    if (!auth) throw new Error("Auth instance not ready");
    await auth.signIn();
  };

  const signOut = async () => {
    const gapi = (window as any).gapi;
    const auth = gapi?.auth2?.getAuthInstance();
    if (!auth) throw new Error("Auth instance not ready");
    await auth.signOut();
  };

  const loadCalendars = async () => {
    const gapi = (window as any).gapi;
    const res = await gapi.client.calendar.calendarList.list();
    const items = res?.result?.items || [];
    setCalendars(items);
    // auto-select first calendar (usually primary)
    if (items.length) {
      const id = items[0].id;
      setSelectedCalendarId(id);
      await loadEventsForCalendar(id);
    }
  };

  const loadEventsForCalendar = async (calendarId: string) => {
    const gapi = (window as any).gapi;
    const resp = await gapi.client.calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 25,
      orderBy: "startTime",
    });
    setEvents(resp?.result?.items || []);
  };

  const selectCalendar = async (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    await loadEventsForCalendar(calendarId);
  };

  const reloadEvents = async () => {
    if (selectedCalendarId) await loadEventsForCalendar(selectedCalendarId);
  };

  return (
    <GoogleAuthContext.Provider value={{
      gapiReady, isSignedIn, calendars, events, selectedCalendarId,
      signIn, signOut, selectCalendar, reloadEvents
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error("useGoogleAuth must be used inside GoogleAuthProvider");
  return ctx;
};