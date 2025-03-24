import networkService, { ApiResponse } from '@/services/networkService';
import { Validator } from '@/types';

export interface CreateValidatorRequest {
  reservable_id: string;
  description: string;
}

export interface UpdateValidatorStatusRequest {
  is_active: boolean;
}

export interface ValidateReservationRequest {
  reservableId: string;
  startTime: string;
  endTime: string;
}

/**
 * Creates a new validator for a reservable
 * @param validatorData The validator data to create
 * @returns Promise with the created validator data
 */
export const createValidator = async (validatorData: CreateValidatorRequest): Promise<ApiResponse<Validator>> => {
  // Validate required fields
  if (!validatorData.reservable_id) {
    throw new Error('Reservable ID is required');
  }
  if (!validatorData.description) {
    throw new Error('Description is required');
  }

  return networkService.post<Validator>('/validators', validatorData);
};

/**
 * Retrieves all validators for a specific reservable
 * @param reservableId UUID of the reservable
 * @returns Promise with the reservable's validators
 */
export const getReservableValidators = async (reservableId: string): Promise<ApiResponse<Validator[]>> => {
  if (!reservableId) {
    throw new Error('Reservable ID is required');
  }

  return networkService.get<Validator[]>(`/validators/reservable/${reservableId}`);
};

/**
 * Retrieves a specific validator by ID
 * @param id UUID of the validator
 * @returns Promise with the validator data
 */
export const getValidator = async (id: string): Promise<ApiResponse<Validator>> => {
  if (!id) {
    throw new Error('Validator ID is required');
  }

  return networkService.get<Validator>(`/validators/${id}`);
};

/**
 * Toggle validator active status
 * @param id UUID of the validator
 * @param statusData The status data to update (is_active)
 * @returns Promise with the updated validator data
 */
export const toggleValidatorStatus = async (
  id: string, 
  statusData: UpdateValidatorStatusRequest
): Promise<ApiResponse<Validator>> => {
  // Validate required fields
  if (!id) {
    throw new Error('Validator ID is required');
  }
  
  if (statusData.is_active === undefined) {
    throw new Error('Status is required');
  }

  return networkService.patch<Validator>(`/validators/${id}/status`, statusData);
};

/**
 * Deletes a specific validator by ID
 * @param id UUID of the validator
 * @returns Promise with success message
 */
export const deleteValidator = async (id: string): Promise<ApiResponse<void>> => {
  if (!id) {
    throw new Error('Validator ID is required');
  }

  return networkService.delete<void>(`/validators/${id}`);
};