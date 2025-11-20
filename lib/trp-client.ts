/**
 * TRP API Client for Authentication
 * Handles login and token refresh with TRP backend
 */

import type { TRPLoginResponse, TRPRefreshResponse, TRPAuthenticatedUser } from './types';

const TRP_API_BASE_URL = process.env.NEXT_PUBLIC_TRP_API_BASE_URL || 'https://api.kingbuserp.link';

/**
 * Login to TRP API
 * @returns TRP user info and tokens if successful, null otherwise
 */
export async function trpLogin(
  userId: string,
  password: string
): Promise<{ user: TRPAuthenticatedUser; accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${TRP_API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        password: password,
      }),
    });

    if (!response.ok) {
      console.error('TRP login failed:', response.status, response.statusText);
      return null;
    }

    const data: TRPLoginResponse = await response.json();

    if (data.result === 'false' || typeof data.data === 'number') {
      console.error('TRP login failed:', data.message);
      return null;
    }

    // Check if user has admin role
    const user = data.data.authenticatedUser || data.data.authenticated_user;
    if (user.role !== '관리자' && user.role !== '최고관리자') {
      console.error('TRP login failed: User does not have admin role:', user.role);
      return null;
    }

    return {
      user,
      accessToken: data.data.access,
      refreshToken: data.data.refresh,
    };
  } catch (error) {
    console.error('TRP login error:', error);
    return null;
  }
}

/**
 * Refresh TRP access token
 * @returns New access token if successful, null otherwise
 */
export async function trpRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${TRP_API_BASE_URL}/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('TRP token refresh failed:', response.status, response.statusText);
      return null;
    }

    const data: TRPRefreshResponse = await response.json();

    if (data.result === 'false' || typeof data.data === 'number') {
      console.error('TRP token refresh failed:', data.message);
      return null;
    }

    return data.data.access;
  } catch (error) {
    console.error('TRP token refresh error:', error);
    return null;
  }
}

/**
 * Logout from TRP API
 * Note: TRP logout requires access token in Authorization header
 */
export async function trpLogout(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${TRP_API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TRP logout failed:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    return data.result === 'true';
  } catch (error) {
    console.error('TRP logout error:', error);
    return false;
  }
}
