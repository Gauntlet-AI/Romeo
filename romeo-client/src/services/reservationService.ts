import networkService, { ApiResponse } from '@/services/networkService';
import { Reservation } from '@/types';

export interface CreateReservationRequest {
  reservable_id: string;
  start_time_iso8601: string;
  end_time_iso8601: string;
  notes?: string;
  constraint_inputs?: Record<string, string>;
}

export interface ReservationResponse {
  reservation: Reservation;
  status: string;
}

export interface ReservableReservationsResponse {
  reservations: Reservation[];
  filters: {
    start_time: string | null;
    end_time: string | null;
  };
}

/**
 * Creates a new reservation for a reservable
 * @param reservationData The reservation data to create
 * @returns Promise with the created reservation data and status
 */
export const createReservation = async (
  reservationData: CreateReservationRequest
): Promise<ApiResponse<ReservationResponse>> => {
  // Validate required fields
  if (!reservationData.reservable_id) {
    throw new Error('Reservable ID is required');
  }
  if (!reservationData.start_time_iso8601) {
    throw new Error('Start time is required');
  }
  if (!reservationData.end_time_iso8601) {
    throw new Error('End time is required');
  }

  return networkService.post<ReservationResponse>('/reservations', reservationData);
};

/**
 * Retrieves all reservations for a specific reservable with optional time range filters
 * @param reservableId UUID of the reservable
 * @param startTime Optional ISO8601 timestamp for filtering reservations by start time
 * @param endTime Optional ISO8601 timestamp for filtering reservations by end time
 * @returns Promise with the reservable's reservations and applied filters
 */
export const getReservableReservations = async (
  reservableId: string,
  startTime?: string,
  endTime?: string
): Promise<ApiResponse<ReservableReservationsResponse>> => {
  if (!reservableId) {
    throw new Error('Reservable ID is required');
  }

  // Build query params
  let endpoint = `/reservations/reservable/${reservableId}`;
  const queryParams: string[] = [];
  
  if (startTime) {
    queryParams.push(`start_time=${encodeURIComponent(startTime)}`);
  }
  
  if (endTime) {
    queryParams.push(`end_time=${encodeURIComponent(endTime)}`);
  }
  
  if (queryParams.length > 0) {
    endpoint += `?${queryParams.join('&')}`;
  }

  return networkService.get<ReservableReservationsResponse>(endpoint);
};

/**
 * Retrieves all reservations for the authenticated user
 * @returns Promise with the user's reservations
 */
export const getUserReservations = async (): Promise<ApiResponse<Reservation[]>> => {
  return networkService.get<Reservation[]>('/reservations/user');
};

/**
 * Retrieves a specific reservation by ID
 * @param id UUID of the reservation
 * @returns Promise with the reservation data
 */
export const getReservation = async (id: string): Promise<ApiResponse<Reservation>> => {
  if (!id) {
    throw new Error('Reservation ID is required');
  }

  return networkService.get<Reservation>(`/reservations/${id}`);
};

/**
 * Deletes a specific reservation by ID
 * @param id UUID of the reservation
 * @returns Promise with deletion information
 */
export const deleteReservation = async (
  id: string
): Promise<ApiResponse<{ id: string; was_owner: boolean; was_reservable_owner: boolean }>> => {
  if (!id) {
    throw new Error('Reservation ID is required');
  }

  return networkService.delete(`/reservations/${id}`);
}; 