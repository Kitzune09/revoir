import { createContext, useContext, useState, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
  }
}

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

interface GoogleAuthContextType {
  isSignedIn: boolean;
  isInitialized: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  addEventsToCalendar: (events: CalendarEvent[]) => Promise<void>;
  listUpcomingEvents: () => Promise<any[]>;
  selectedCalendarId: string;
}

interface CalendarEvent {
  summary: string;
  description: string;
  start: { dateTime: string };
  end: { dateTime: string };
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCalendarId] = useState('primary');

  useEffect(() => {
    const initializeGoogleAPI = async () => {
      try {
        await new Promise<void>((resolve) => {
          if (window.gapi) {
            resolve();
          } else {
            window.addEventListener('load', () => resolve());
          }
        });

        await new Promise<void>((resolve) => {
          window.gapi.load('client:auth2', () => resolve());
        });

        await window.gapi.client.init({
          apiKey: 'YOUR_API_KEY',
          clientId: 'YOUR_CLIENT_ID',
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES,
        });

        const authInstance = window.gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(setIsSignedIn);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Google API:', error);
        setIsInitialized(true);
      }
    };

    initializeGoogleAPI();
  }, []);

  const signIn = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const addEventsToCalendar = async (events: CalendarEvent[]): Promise<void> => {
    if (!isSignedIn) {
      throw new Error('User is not signed in to Google');
    }

    try {
      for (const event of events) {
        await window.gapi.client.calendar.events.insert({
          calendarId: selectedCalendarId,
          resource: event,
        });
      }
    } catch (error) {
      console.error('Error adding events to calendar:', error);
      throw error;
    }
  };

  const listUpcomingEvents = async () => {
    if (!isSignedIn) {
      return [];
    }

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: selectedCalendarId,
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      });
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  };

  const value = {
    isSignedIn,
    isInitialized,
    signIn,
    signOut,
    addEventsToCalendar,
    listUpcomingEvents,
    selectedCalendarId,
  };

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}
