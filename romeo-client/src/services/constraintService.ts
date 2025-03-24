import networkService, { ApiResponse } from '@/services/networkService';
import { Constraint, ConstraintType } from '@/types';

export interface CreateConstraintRequest {
  reservable_id: string;
  name: string;
  type: ConstraintType;
  value: string | number;
}

export interface UpdateConstraintRequest {
  name?: string;
  type?: ConstraintType;
  value?: string | number;
}

/**
 * Creates a new constraint for a reservable
 * @param constraintData The constraint data to create
 * @returns Promise with the created constraint data
 */
export const createConstraint = async (constraintData: CreateConstraintRequest): Promise<ApiResponse<Constraint>> => {
  // Validate required fields
  if (!constraintData.reservable_id) {
    throw new Error('Reservable ID is required');
  }
  if (!constraintData.name) {
    throw new Error('Name is required');
  }
  if (!constraintData.type) {
    throw new Error('Type is required');
  }
  if (constraintData.value === undefined || constraintData.value === null) {
    throw new Error('Value is required');
  }

  return networkService.post<Constraint>('/constraints', constraintData);
};

/**
 * Retrieves all constraints for a specific reservable
 * @param reservableId UUID of the reservable
 * @returns Promise with the reservable's constraints
 */
export const getReservableConstraints = async (reservableId: string): Promise<ApiResponse<Constraint[]>> => {
  if (!reservableId) {
    throw new Error('Reservable ID is required');
  }

  return networkService.get<Constraint[]>(`/constraints/reservable/${reservableId}`);
};

/**
 * Retrieves a specific constraint by ID
 * @param id UUID of the constraint
 * @returns Promise with the constraint data
 */
export const getConstraint = async (id: string): Promise<ApiResponse<Constraint>> => {
  if (!id) {
    throw new Error('Constraint ID is required');
  }

  return networkService.get<Constraint>(`/constraints/${id}`);
};

/**
 * Updates a specific constraint by ID
 * @param id UUID of the constraint
 * @param constraintData The data to update
 * @returns Promise with the updated constraint data
 */
export const updateConstraint = async (
  id: string, 
  constraintData: UpdateConstraintRequest
): Promise<ApiResponse<Constraint>> => {
  // Validate required fields
  if (!id) {
    throw new Error('Constraint ID is required');
  }
  
  // Check if there's at least one field to update
  if (!constraintData.name && !constraintData.type && constraintData.value === undefined) {
    throw new Error('At least one field must be provided for update');
  }

  return networkService.put<Constraint>(`/constraints/${id}`, constraintData);
};

/**
 * Deletes a specific constraint by ID
 * @param id UUID of the constraint
 * @returns Promise with success message
 */
export const deleteConstraint = async (id: string): Promise<ApiResponse<void>> => {
  if (!id) {
    throw new Error('Constraint ID is required');
  }

  return networkService.delete<void>(`/constraints/${id}`);
}; 