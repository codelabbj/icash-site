import { fcmService } from './firebase';
import { fcmApi } from './api-client';

/**
 * Initialize FCM and get token
 * @returns FCM token or null if permission denied/error
 */
export async function initializeFCM(userId?: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    console.log('[FCM] Starting initialization...');
    
    // Check current permission state first
    const currentPermission = Notification.permission;
    console.log('[FCM] Current permission:', currentPermission);
    
    if (currentPermission === 'denied') {
      console.warn('[FCM] Notification permission is already denied');
      return null;
    }
    
    // Register service worker first
    console.log('[FCM] Registering service worker...');
    await fcmService.registerServiceWorker();
    console.log('[FCM] Service worker registered');

    // Request notification permission (this will show the browser prompt)
    console.log('[FCM] Requesting notification permission...');
    const permission = await fcmService.requestNotificationPermission();
    console.log('[FCM] Permission result:', permission);
    
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted:', permission);
      return null;
    }

    // Get FCM token
    console.log('[FCM] Getting FCM token...');
    const token = await fcmService.refreshToken();
    
    if (token) {
      console.log('[FCM] Token generated successfully:', token.substring(0, 20) + '...');
      // Store token in localStorage for persistence
      localStorage.setItem('fcm_token', token);
      
      // Send token to backend if userId provided
      if (userId) {
        await sendTokenToBackend(token, userId);
      }
    } else {
      console.warn('[FCM] No token generated');
    }

    return token;
  } catch (error) {
    console.error('[FCM] Error initializing FCM:', error);
    return null;
  }
}

/**
 * Send FCM token to backend
 * @param token FCM token
 * @param userId Optional user ID
 * @returns Promise<boolean> Success status
 */
export async function sendTokenToBackend(
  token: string, 
  userId?: string
): Promise<boolean> {
  try {
    // Send to backend API using the api-client
    await fcmApi.registerToken(token, 'web', userId);
    console.log('[FCM] Token sent to backend successfully');
    return true;
  } catch (error: any) {
    // Silently handle errors - token is still saved in localStorage
    const errorMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.message || 'Unknown error';
    console.warn('[FCM] Could not send token to backend (token saved locally):', errorMessage);
    
    // Don't show toast for 404/endpoint not found - backend might not have this endpoint yet
    if (error?.response?.status !== 404 && error?.response?.status !== 501) {
      console.warn('[FCM] Backend endpoint might not be implemented yet');
    }
    
    return false;
  }
}

/**
 * Complete FCM setup flow
 * 1. Request permission
 * 2. Get token
 * 3. Send to backend
 * @param userId Optional user ID
 * @returns Promise<string | null> FCM token or null
 */
export async function setupNotifications(userId?: string): Promise<string | null> {
  try {
    // Step 1: Initialize FCM and get token (userId is passed through to backend)
    const token = await initializeFCM(userId);
    
    if (!token) {
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
}

/**
 * Setup foreground message listener
 */
export function setupForegroundListener(
  onMessage: (payload: any) => void
): void {
  fcmService.setupForegroundListener((payload) => {
    console.log('Foreground message received:', payload);
    onMessage(payload);
  });
}

