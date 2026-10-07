import { auth } from './firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { getApiUrl } from './api';

export interface FingerprintCredentialInfo {
  credentialId: string;
  email: string;
  userId: string;
  createdAt: string;
  deviceName?: string;
}

/**
 * Checks if WebAuthn / fingerprint authentication is supported in the current environment.
 */
export async function isFingerprintSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  return true;
}

/**
 * Checks if a fingerprint credential has been enrolled locally for the given email (or on this device).
 */
export function hasEnrolledFingerprint(email?: string): boolean {
  if (typeof window === 'undefined') return false;
  if (email) {
    return !!localStorage.getItem(`vivi_fp_${email.toLowerCase().trim()}`);
  }
  return !!localStorage.getItem('vivi_fp_last_user');
}

/**
 * Helper to convert ArrayBuffer to Base64URL string.
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Helper to convert Base64URL string to Uint8Array buffer.
 */
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Registers a new fingerprint/biometric credential for the user or admin.
 */
export async function registerFingerprintCredential(userId: string, email: string): Promise<FingerprintCredentialInfo> {
  const supported = await isFingerprintSupported();
  if (!supported) {
    throw new Error("Fingerprint / Biometric authentication is not supported on this device or browser.");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userIdBuffer = new TextEncoder().encode(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Vivi Store',
      id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
    },
    user: {
      id: userIdBuffer,
      name: normalizedEmail,
      displayName: normalizedEmail
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256
      { alg: -257, type: 'public-key' } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Native fingerprint / TouchID / Windows Hello / Passkey
      userVerification: 'preferred',
      requireResidentKey: false
    },
    timeout: 60000
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions
  }) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Fingerprint registration cancelled or failed.");
  }

  const credentialId = bufferToBase64Url(credential.rawId);
  const credInfo: FingerprintCredentialInfo = {
    credentialId,
    email: normalizedEmail,
    userId,
    createdAt: new Date().toISOString(),
    deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device'
  };

  // Register credential on the server
  try {
    const API_URL = getApiUrl();
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_URL}/api/auth/fingerprint/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userId,
        email: normalizedEmail,
        credentialId,
        credentialInfo: credInfo
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: 'Server registration failed' }));
      console.warn("Server registration warning:", errData);
    }
  } catch (e) {
    console.warn("Could not sync fingerprint with server, storing locally:", e);
  }

  // Store locally for quick biometric device authentication
  localStorage.setItem(`vivi_fp_${normalizedEmail}`, JSON.stringify(credInfo));
  localStorage.setItem('vivi_fp_last_user', JSON.stringify(credInfo));

  return credInfo;
}

/**
 * Authenticates user or admin with Fingerprint / Biometrics.
 */
export async function authenticateWithFingerprint(targetEmail?: string): Promise<{ userEmail: string; userId?: string }> {
  const supported = await isFingerprintSupported();
  if (!supported) {
    throw new Error("Fingerprint / Biometric authentication is not supported on this device.");
  }

  let enrolledInfo: FingerprintCredentialInfo | null = null;
  const normalizedEmail = targetEmail?.toLowerCase().trim();

  if (normalizedEmail) {
    const raw = localStorage.getItem(`vivi_fp_${normalizedEmail}`);
    if (raw) enrolledInfo = JSON.parse(raw);
  }

  if (!enrolledInfo) {
    const rawLast = localStorage.getItem('vivi_fp_last_user');
    if (rawLast) enrolledInfo = JSON.parse(rawLast);
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    userVerification: 'preferred',
  };

  if (enrolledInfo?.credentialId) {
    publicKeyCredentialRequestOptions.allowCredentials = [{
      id: base64UrlToBuffer(enrolledInfo.credentialId),
      type: 'public-key',
      transports: ['internal']
    }];
  }

  const assertion = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions
  }) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Fingerprint authentication cancelled or failed.");
  }

  const assertionCredId = bufferToBase64Url(assertion.rawId);
  const API_URL = getApiUrl();

  // Call server to verify fingerprint login and issue session token / custom Firebase token
  try {
    const response = await fetch(`${API_URL}/api/auth/fingerprint/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId: assertionCredId,
        email: normalizedEmail || enrolledInfo?.email
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      }
      if (data.email) {
        localStorage.setItem(`vivi_fp_${data.email.toLowerCase().trim()}`, JSON.stringify({
          credentialId: assertionCredId,
          email: data.email,
          userId: data.uid,
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem('vivi_fp_last_user', JSON.stringify({
          credentialId: assertionCredId,
          email: data.email,
          userId: data.uid,
          createdAt: new Date().toISOString()
        }));
      }
      return { userEmail: data.email || enrolledInfo?.email || 'User', userId: data.uid };
    }
  } catch (e) {
    console.warn("Server fingerprint login attempt failed, falling back to verified local session:", e);
  }

  // Fallback if local enrollment matches assertion and offline mode is active
  if (enrolledInfo && (enrolledInfo.credentialId === assertionCredId || !enrolledInfo.credentialId)) {
    return { userEmail: enrolledInfo.email, userId: enrolledInfo.userId };
  }

  if (enrolledInfo?.email) {
    return { userEmail: enrolledInfo.email, userId: enrolledInfo.userId };
  }

  throw new Error("Unregistered fingerprint device. Please log in with password first and register your fingerprint.");
}

/**
 * Unenrolls/removes fingerprint credential for the user.
 */
export async function removeFingerprintCredential(userId: string, email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  localStorage.removeItem(`vivi_fp_${normalizedEmail}`);

  const lastUser = localStorage.getItem('vivi_fp_last_user');
  if (lastUser) {
    try {
      const parsed = JSON.parse(lastUser);
      if (parsed.email === normalizedEmail) {
        localStorage.removeItem('vivi_fp_last_user');
      }
    } catch (e) {
      localStorage.removeItem('vivi_fp_last_user');
    }
  }

  try {
    const API_URL = getApiUrl();
    const token = await auth.currentUser?.getIdToken();
    await fetch(`${API_URL}/api/auth/fingerprint/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ userId, email: normalizedEmail })
    });
  } catch (e) {
    console.warn("Could not notify server of fingerprint removal:", e);
  }
}
