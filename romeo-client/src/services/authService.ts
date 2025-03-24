import networkService, { ApiResponse } from '@/services/networkService';
import { User } from '@/types';

/**
 * Interface for login request payload
 */
export interface LoginRequest {
  email: string;
}

/**
 * Interface for verify response
 */
export interface VerifyResponse {
  user: User;
}

/**
 * Sends a login request to the authentication endpoint
 * @param email The email address to authenticate
 * @returns Promise with the login response
 * @throws Error if email is invalid or request fails
 */
export const login = async (email: string): Promise<ApiResponse<void>> => {
  // Validate email format
  if (!email || !isValidEmail(email)) {
    throw new Error('Valid email is required');
  }

  // Make the login request
  return networkService.post<void>('/auth/login', { email });
};

/**
 * Verifies a token from a magic link
 * @param token The token from the magic link
 * @returns Promise with the user data and JWT token
 */
export const verify = async (token: string): Promise<ApiResponse<VerifyResponse>> => {
  if (!token) {
    throw new Error('Token is required');
  }

  // Make the verify request
  return networkService.get<VerifyResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
};

/**
 * Logs the user out by clearing the authentication token
 */
export const logout = (): void => {
  // Clear the token from storage
  networkService.clearToken();
};

/**
 * Validates an email address format
 * @param email The email to validate
 * @returns Boolean indicating if the email is valid
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 