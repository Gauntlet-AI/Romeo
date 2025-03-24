import networkService, { ApiResponse } from '@/services/networkService';
import { Reservable } from '@/types';

export interface CreateReservableRequest {
  name: string;
  description?: string;
}

export interface UpdateReservableRequest {
  name: string;
  description?: string;
}

export interface CollectionRequest {
  parent_id: string;
  child_id: string;
}

/**
 * Creates a new reservable resource
 * @param reservableData The reservable data to create
 * @returns Promise with the created reservable data
 */
export const createReservable = async (reservableData: CreateReservableRequest): Promise<ApiResponse<Reservable>> => {
  // Validate required fields
  if (!reservableData.name) {
    throw new Error('Name is required');
  }

  return networkService.post<Reservable>('/reservables', reservableData);
};

/**
 * Retrieves all reservables owned by the authenticated user
 * @returns Promise with the user's reservables
 */
export const getUserReservables = async (): Promise<ApiResponse<Reservable[]>> => {
  return networkService.get<Reservable[]>('/reservables/user');
};

/**
 * Retrieves a specific reservable by ID
 * @param id UUID of the reservable
 * @returns Promise with the reservable data
 */
export const getReservable = async (id: string): Promise<ApiResponse<Reservable>> => {
  if (!id) {
    throw new Error('Reservable ID is required');
  }

  return networkService.get<Reservable>(`/reservables/${id}`);
};

/**
 * Updates a specific reservable by ID
 * @param id UUID of the reservable
 * @param reservableData The data to update
 * @returns Promise with the updated reservable data
 */
export const updateReservable = async (
  id: string, 
  reservableData: UpdateReservableRequest
): Promise<ApiResponse<Reservable>> => {
  // Validate required fields
  if (!id) {
    throw new Error('Reservable ID is required');
  }
  
  if (!reservableData.name) {
    throw new Error('Name is required');
  }

  return networkService.put<Reservable>(`/reservables/${id}`, reservableData);
};

/**
 * Deletes a specific reservable by ID
 * @param id UUID of the reservable
 * @returns Promise with success message
 */
export const deleteReservable = async (id: string): Promise<ApiResponse<void>> => {
  if (!id) {
    throw new Error('Reservable ID is required');
  }

  return networkService.delete<void>(`/reservables/${id}`);
};

/**
 * Adds a reservable to a collection (creates parent-child relationship)
 * @param collectionData The parent and child IDs
 * @returns Promise with success message
 */
export const addReservableToCollection = async (collectionData: CollectionRequest): Promise<ApiResponse<void>> => {
  // Validate required fields
  if (!collectionData.parent_id || !collectionData.child_id) {
    throw new Error('Parent ID and Child ID are required');
  }

  return networkService.post<void>('/reservables/collection', collectionData);
};

/**
 * Removes a reservable from a collection (removes parent-child relationship)
 * @param parentId UUID of the parent reservable
 * @param childId UUID of the child reservable
 * @returns Promise with success message
 */
export const removeReservableFromCollection = async (
  parentId: string, 
  childId: string
): Promise<ApiResponse<void>> => {
  // Validate required fields
  if (!parentId || !childId) {
    throw new Error('Parent ID and Child ID are required');
  }

  return networkService.delete<void>(`/reservables/collection/${parentId}/${childId}`);
};

/**
 * Retrieves all children of a specific reservable
 * @param id UUID of the parent reservable
 * @returns Promise with the children reservables
 */
export const getReservableChildren = async (id: string): Promise<ApiResponse<Reservable[]>> => {
  if (!id) {
    throw new Error('Reservable ID is required');
  }

  return networkService.get<Reservable[]>(`/reservables/${id}/children`);
}; 