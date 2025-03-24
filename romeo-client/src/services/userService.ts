import networkService, { ApiResponse } from '@/services/networkService';
import { User } from '@/types';

export interface CreateUserRequest {
  email: string;
  name?: string;
}

/**
 * Creates a new user account
 * @param userData The user data to create an account with
 * @returns Promise with the created user data and token
 */
export const createUser = async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
  // Validate email format
  if (!userData.email || !isValidEmail(userData.email)) {
    throw new Error('Valid email is required');
  }

  return networkService.post<User>('/users', userData);
};

/**
 * Retrieves the authenticated user's profile information
 * @returns Promise with the user profile data
 */
export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  // This endpoint requires authentication - the networkService will automatically 
  // add the token if available
  return networkService.get<User>('/users/profile');
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