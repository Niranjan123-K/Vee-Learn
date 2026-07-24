import { google } from 'googleapis';
import { getAuthenticatedClient } from './tokenService.js';

/**
 * Creates a Google Calendar event with a Google Meet link.
 */
export async function createEvent(teacherId, sessionDetails) {
  const auth = await getAuthenticatedClient(teacherId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `Vee Learn Session: ${sessionDetails.skillName}`,
    description: `Teacher: ${sessionDetails.teacherName}\nLearner: ${sessionDetails.learnerName}\nNotes: ${sessionDetails.notes || 'N/A'}`,
    start: {
      dateTime: new Date(sessionDetails.scheduledAt).toISOString(),
    },
    end: {
      dateTime: new Date(
        new Date(sessionDetails.scheduledAt).getTime() + sessionDetails.durationMinutes * 60000
      ).toISOString(),
    },
    conferenceData: {
      createRequest: {
        requestId: sessionDetails.sessionId, // unique ID per session
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
    attendees: [
      { email: sessionDetails.learnerEmail },
      { email: sessionDetails.teacherEmail },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1, // Crucial to generate Meet link
      sendUpdates: 'all', // Sends email invitations
    });

    return {
      calendarEventId: res.data.id,
      meetingLink: res.data.hangoutLink,
    };
  } catch (err) {
    console.error('[CalendarService] Failed to create event:', err.message);
    
    // If the token was revoked or invalid, we could mark the integration as REVOKED here
    if (err.code === 401 || err.code === 403) {
       // Optional: await revokeIntegration(teacherId);
       throw new Error('Google Calendar access expired or revoked. Please reconnect.');
    }
    throw err;
  }
}

/**
 * Deletes a Google Calendar event.
 */
export async function deleteEvent(teacherId, eventId) {
  try {
    const auth = await getAuthenticatedClient(teacherId);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });
  } catch (err) {
    console.error('[CalendarService] Failed to delete event:', err.message);
    throw err;
  }
}
