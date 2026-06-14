import { getAccessToken } from './auth';

export async function createCalendarEvent(title: string, date: string, time: string, attendees: string[] = []): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const startDateTime = new Date(`${date}T${time}:00`).toISOString();
  const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour duration

  const event = {
    summary: title,
    start: {
      dateTime: startDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: attendees.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to create event:', err);
    throw new Error('Failed to create calendar event');
  }

  const data = await res.json();
  return data.id;
}

export async function deleteCalendarEvent(eventId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to delete calendar event');
  }
}

export async function listCalendarEvents(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token available');

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=10', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Failed to list calendar events:', errText);
    return [];
  }

  const data = await res.json();
  return data.items || [];
}
