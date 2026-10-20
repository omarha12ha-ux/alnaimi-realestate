import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { Appointment } from '../types';

// Cache the access token in memory.
let cachedAccessToken: string | null = null;

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Initiates the Google sign-in flow requesting calendar.events scope to retrieve an access token.
 */
export const fetchGoogleCalendarToken = async (): Promise<string> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPE);
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token from the authenticator.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error) {
    console.error('Google Auth Popup Error:', error);
    throw error;
  }
};

/**
 * Set token explicitly if needed, or clear it.
 */
export const setCachedGoogleToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCachedGoogleToken = () => {
  return cachedAccessToken;
};

/**
 * Creates an event in the user's primary Google Calendar.
 */
export const createGoogleCalendarEvent = async (
  appointment: Appointment,
  displayTitle: string,
  displayLocation: string,
  accessToken: string
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    const dateStr = appointment.date; // YYYY-MM-DD
    let timeStr = appointment.time; // HH:MM
    
    // Ensure HH:MM:00 format
    if (!timeStr || !timeStr.includes(':')) {
      timeStr = '12:00';
    }
    const [hours, minutes] = timeStr.split(':').map(x => {
      const parsed = parseInt(x, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

    const pad = (num: number) => num.toString().padStart(2, '0');
    
    // Create local appointment start date
    const startDateStr = `${dateStr}T${pad(hours)}:${pad(minutes)}:00`;
    
    // Default duration is 1 hour
    const endHours = (hours + 1) % 24;
    // Handle day wrap if end hours wraps to next day
    const endDateStr = `${dateStr}T${pad(endHours)}:${pad(minutes)}:00`;

    const eventPayload = {
      summary: `معاينة عقارية: ${displayTitle}`,
      location: displayLocation,
      description: `تفاصيل الموعد المحجوز عبر شركة النعيمي العقارية الفاخرة.\n\nالعميل: ${appointment.clientName}\nرقم الاتصال: ${appointment.clientPhone || 'غير متوفر'}\nحالة الموعد الحالية: ${
        appointment.status === 'confirmed' ? '✓ مؤكد ومثبت' : 'قيد المراجعة والانتظار'
      }\nموقع المعاينة: ${displayLocation}\nتاريخ وساعة الموعد: ${appointment.date} في تمام الساعة ${appointment.time}\n\nشكراً لاختياركم النعيمي للعقارات الفاخرة.`,
      start: {
        dateTime: startDateStr,
        timeZone: 'Asia/Damascus', // Local Syrian zone as Syrian real estate app
      },
      end: {
        dateTime: endDateStr,
        timeZone: 'Asia/Damascus',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Calendar Event Creation Failed:', errorData);
      throw new Error(errorData.error?.message || 'حجم أو صيغة البيانات غير مطابقة لتقويم Google.');
    }

    const createdEvent = await response.json();
    return { success: true, eventId: createdEvent.id };
  } catch (err: any) {
    console.error('createGoogleCalendarEvent exception:', err);
    return { success: false, error: err.message || 'حدث خطأ غير معروف أثناء إنشاء الموعد' };
  }
};
