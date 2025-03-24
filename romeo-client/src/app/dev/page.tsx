/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { createUser, getUserProfile, CreateUserRequest } from '@/services/userService';
import networkService from '@/services/networkService';
import { login, logout } from '@/services/authService';
import { 
  createReservable, 
  getUserReservables, 
  getReservable, 
  updateReservable, 
  deleteReservable,
  addReservableToCollection,
  removeReservableFromCollection,
  getReservableChildren,
  CreateReservableRequest,
  UpdateReservableRequest,
  CollectionRequest,
} from '@/services/reservableService';
import {
  createConstraint,
  getReservableConstraints,
  getConstraint,
  updateConstraint,
  deleteConstraint,
  CreateConstraintRequest,
  UpdateConstraintRequest,
} from '@/services/constraintService';
import {
  createValidator,
  getReservableValidators,
  getValidator,
  toggleValidatorStatus,
  deleteValidator,
  CreateValidatorRequest,
  UpdateValidatorStatusRequest
} from '@/services/validatorService';
import {
  createReservation,
  getReservableReservations,
  getUserReservations,
  getReservation,
  deleteReservation,
  CreateReservationRequest
} from '@/services/reservationService';

import {
  Reservable,
  ConstraintType,
  Validator,
  Reservation
} from '@/types';

// Component for displaying API response results
const ResponseDisplay = ({ data, error }: { data: any; error: string | null }) => {
  if (error) {
    return <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">{error}</div>;
  }
  
  if (!data) return null;
  
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-md">
      <h3 className="font-mono text-sm font-semibold mb-2">Response:</h3>
      <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-auto max-h-60 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

// Type for API category
type ApiCategory = 'auth' | 'user' | 'reservable' | 'constraint' | 'validator' | 'reservation';

// Default endpoints for each category
const defaultEndpoints: Record<ApiCategory, string> = {
  auth: '/api/auth/login',
  user: '/api/users',
  reservable: '/api/reservables',
  constraint: '/api/constraints',
  validator: '/api/validators',
  reservation: '/api/reservations'
};

// Type for request log entries
interface RequestLogEntry {
  timestamp: Date;
  method: string;
  endpoint: string;
  request?: any;
  response?: any;
  error?: string;
}

// Interface for localStorage item
interface LocalStorageItem {
  key: string;
  value: string;
  type: string;
}

export default function DevPage() {
  // State for category navigation
  const [activeCategory, setActiveCategory] = useState<ApiCategory>('auth');
  
  // State for create user form
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // State for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginResponse, setLoginResponse] = useState<any>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // State for token management
  const [token, setToken] = useState('');
  
  // State for API responses and errors
  const [createUserResponse, setCreateUserResponse] = useState<any>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  
  const [profileResponse, setProfileResponse] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // State for generic API testing
  const [endpoint, setEndpoint] = useState('/api/users/profile');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [genericResponse, setGenericResponse] = useState<any>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  
  // State for request logs
  const [requestLogs, setRequestLogs] = useState<RequestLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // State for localStorage visualization
  const [localStorageItems, setLocalStorageItems] = useState<LocalStorageItem[]>([]);
  const [showLocalStorage, setShowLocalStorage] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LocalStorageItem | null>(null);
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');
  
  // State for reservable form
  const [reservableName, setReservableName] = useState('Meeting Room A');
  const [reservableDescription, setReservableDescription] = useState('Conference room for team meetings');
  const [reservableId, setReservableId] = useState('');
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [reservableResponse, setReservableResponse] = useState<any>(null);
  const [reservableError, setReservableError] = useState<string | null>(null);
  
  // State for constraint form
  const [constraintName, setConstraintName] = useState('Time Limit');
  const [constraintType, setConstraintType] = useState<ConstraintType>(ConstraintType.STRING);
  const [constraintValue, setConstraintValue] = useState('2h');
  const [constraintId, setConstraintId] = useState('');
  const [constraintReservableId, setConstraintReservableId] = useState('');
  const [constraintResponse, setConstraintResponse] = useState<any>(null);
  const [constraintError, setConstraintError] = useState<string | null>(null);
  
  // State for validator form
  const [validatorDescription, setValidatorDescription] = useState('Check availability');
  const [validatorId, setValidatorId] = useState('');
  const [validatorReservableId, setValidatorReservableId] = useState('');
  const [validatorIsActive, setValidatorIsActive] = useState(true);
  const [validatorResponse, setValidatorResponse] = useState<any>(null);
  const [validatorError, setValidatorError] = useState<string | null>(null);
  
  // State for reservation form
  const [reservationReservableId, setReservationReservableId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [reservationStartTime, setReservationStartTime] = useState(new Date(Date.now() + 3600000).toISOString());
  const [reservationEndTime, setReservationEndTime] = useState(new Date(Date.now() + 7200000).toISOString());
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationResponse, setReservationResponse] = useState<any>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [filterStartTime, setFilterStartTime] = useState('');
  const [filterEndTime, setFilterEndTime] = useState('');
  
  // Function to handle category change
  const handleCategoryChange = (category: ApiCategory) => {
    setActiveCategory(category);
    setEndpoint(defaultEndpoints[category]);
    
    // Reset responses and errors when changing categories
    setGenericResponse(null);
    setGenericError(null);
    setLoginResponse(null);
    setLoginError(null);
    setReservableResponse(null);
    setReservableError(null);
    setConstraintResponse(null);
    setConstraintError(null);
    setValidatorResponse(null);
    setValidatorError(null);
    setReservationResponse(null);
    setReservationError(null);
    
    // Set default request body based on category
    let defaultBody = '';
    switch(category) {
      case 'auth':
        defaultBody = JSON.stringify({
          email: 'user@example.com'
        }, null, 2);
        setMethod('POST');
        setLoginEmail('user@example.com');
        break;
      case 'user':
        defaultBody = JSON.stringify({
          email: 'newuser@example.com',
          name: 'New User'
        }, null, 2);
        setMethod('POST');
        break;
      case 'reservable':
        defaultBody = JSON.stringify({
          name: 'Meeting Room A',
          description: 'Conference room for team meetings'
        }, null, 2);
        setMethod('POST');
        setReservableName('Meeting Room A');
        setReservableDescription('Conference room for team meetings');
        setReservableId('');
        setParentId('');
        setChildId('');
        break;
      case 'reservation':
        defaultBody = JSON.stringify({
          reservable_id: '',
          start_time_iso8601: new Date(Date.now() + 3600000).toISOString(),
          end_time_iso8601: new Date(Date.now() + 7200000).toISOString(),
          notes: 'Meeting reservation'
        }, null, 2);
        setMethod('POST');
        setReservationReservableId('');
        setReservationId('');
        setReservationStartTime(new Date(Date.now() + 3600000).toISOString());
        setReservationEndTime(new Date(Date.now() + 7200000).toISOString());
        setReservationNotes('Meeting reservation');
        setFilterStartTime('');
        setFilterEndTime('');
        break;
      case 'constraint':
        defaultBody = JSON.stringify({
          reservable_id: '',
          name: 'Time Limit',
          type: ConstraintType.STRING,
          value: '2h'
        }, null, 2);
        setMethod('POST');
        setConstraintName('Time Limit');
        setConstraintType(ConstraintType.STRING);
        setConstraintValue('2h');
        setConstraintId('');
        setConstraintReservableId('');
        break;
      case 'validator':
        defaultBody = JSON.stringify({
          reservable_id: '',
          description: 'Check availability'
        }, null, 2);
        setMethod('POST');
        setValidatorDescription('Check availability');
        setValidatorId('');
        setValidatorReservableId('');
        setValidatorIsActive(true);
        break;
      default:
        defaultBody = '';
        setMethod('GET');
    }
    setRequestBody(defaultBody);
  };
  
  // Initialize token from network service
  useEffect(() => {
    const currentToken = networkService.getToken();
    if (currentToken) {
      setToken(currentToken);
    }
  }, []);
  
  // Function to add a log entry
  const addLogEntry = (entry: RequestLogEntry) => {
    setRequestLogs(prevLogs => [entry, ...prevLogs].slice(0, 10)); // Keep only the last 10 logs
  };
  
  // Handler for creating a user
  const handleCreateUser = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/api/users',
      request: { email, name }
    };
    
    try {
      setCreateUserError(null);
      const userData: CreateUserRequest = { email };
      if (name) userData.name = name;
      
      const response = await createUser(userData);
      setCreateUserResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // If a token is returned, update the token state
      if (response.data?.token) {
        setToken(response.data.token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setCreateUserError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting user profile
  const handleGetProfile = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: '/api/users/profile'
    };
    
    try {
      setProfileError(null);
      const response = await getUserProfile();
      setProfileResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setProfileError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for manually setting a token
  const handleSetToken = () => {
    if (token) {
      networkService.setToken(token);
      alert('Token has been set');
    }
  };
  
  // Handler for clearing the token
  const handleClearToken = () => {
    networkService.clearToken();
    setToken('');
    alert('Token has been cleared');
  };
  
  // Handler for login
  const handleLogin = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/auth/login',
      request: { email: loginEmail }
    };
    
    try {
      setLoginError(null);
      
      // Call the login function from authService
      const response = await login(loginEmail);
      setLoginResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // If a token is returned, update the token state
      if (response.data?.token) {
        setToken(response.data.token);
      }
      
      // Show success message
      if (response.success) {
        alert('Login successful! Check the token section for authentication token.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setLoginError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for logout
  const handleLogout = () => {
    // Call logout function from authService
    logout();
    setToken('');
    
    // Add log entry
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/auth/logout'
    };
    logEntry.response = { success: true, message: 'Logged out successfully' };
    addLogEntry(logEntry);
    
    // Show success message
    alert('Logged out successfully!');
  };
  
  // Handler for creating a reservable
  const handleCreateReservable = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/reservables',
      request: { 
        name: reservableName,
        description: reservableDescription 
      }
    };
    
    try {
      setReservableError(null);
      const reservableData: CreateReservableRequest = { 
        name: reservableName
      };
      
      if (reservableDescription) {
        reservableData.description = reservableDescription;
      }
      
      const response = await createReservable(reservableData);
      setReservableResponse(response);
      
      // If there's a reservable in the response, capture its ID
      if (response.data?.reservable) {
        const reservable = response.data.reservable as Reservable;
        setReservableId(reservable.id);
      }
      
      // Update log entry with response
      logEntry.response = response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting all user reservables
  const handleGetUserReservables = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: '/reservables/user'
    };
    
    try {
      setReservableError(null);
      const response = await getUserReservables();
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting a specific reservable
  const handleGetReservable = async () => {
    if (!reservableId) {
      alert('Please enter a reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/reservables/${reservableId}`
    };
    
    try {
      setReservableError(null);
      const response = await getReservable(reservableId);
      setReservableResponse(response);
      
      // If there's a reservable in the response, update the form fields
      if (response.data?.reservable) {
        const reservable = response.data.reservable as Reservable;
        setReservableName(reservable.name);
        setReservableDescription(reservable.description || '');
      }
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for updating a reservable
  const handleUpdateReservable = async () => {
    if (!reservableId) {
      alert('Please enter a reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'PUT',
      endpoint: `/reservables/${reservableId}`,
      request: { 
        name: reservableName,
        description: reservableDescription 
      }
    };
    
    try {
      setReservableError(null);
      const reservableData: UpdateReservableRequest = { 
        name: reservableName
      };
      
      if (reservableDescription) {
        reservableData.description = reservableDescription;
      }
      
      const response = await updateReservable(reservableId, reservableData);
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for deleting a reservable
  const handleDeleteReservable = async () => {
    if (!reservableId) {
      alert('Please enter a reservable ID');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete reservable with ID: ${reservableId}?`)) {
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'DELETE',
      endpoint: `/reservables/${reservableId}`
    };
    
    try {
      setReservableError(null);
      const response = await deleteReservable(reservableId);
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // Clear the reservable ID field on successful deletion
      if (response.success) {
        setReservableId('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for adding a reservable to a collection
  const handleAddToCollection = async () => {
    if (!parentId || !childId) {
      alert('Please enter both parent and child reservable IDs');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/reservables/collection',
      request: { 
        parent_id: parentId,
        child_id: childId 
      }
    };
    
    try {
      setReservableError(null);
      const collectionData: CollectionRequest = { 
        parent_id: parentId,
        child_id: childId 
      };
      
      const response = await addReservableToCollection(collectionData);
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for removing a reservable from a collection
  const handleRemoveFromCollection = async () => {
    if (!parentId || !childId) {
      alert('Please enter both parent and child reservable IDs');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'DELETE',
      endpoint: `/reservables/collection/${parentId}/${childId}`
    };
    
    try {
      setReservableError(null);
      const response = await removeReservableFromCollection(parentId, childId);
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting reservable children
  const handleGetReservableChildren = async () => {
    if (!reservableId) {
      alert('Please enter a reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/reservables/${reservableId}/children`
    };
    
    try {
      setReservableError(null);
      const response = await getReservableChildren(reservableId);
      setReservableResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservableError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for generic API request
  const handleGenericRequest = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method,
      endpoint,
      request: (method === 'POST' || method === 'PUT' || method === 'PATCH') && requestBody ? 
        JSON.parse(requestBody) : undefined
    };
    
    try {
      setGenericError(null);
      let response;
      
      switch (method) {
        case 'GET':
          response = await networkService.get(endpoint);
          break;
        case 'POST':
          let postData = {};
          try {
            if (requestBody) {
              postData = JSON.parse(requestBody);
            }
          } catch (e) {
            setGenericError('Invalid JSON in request body');
            logEntry.error = 'Invalid JSON in request body';
            addLogEntry(logEntry);
            return;
          }
          response = await networkService.post(endpoint, postData);
          break;
        case 'PUT':
          let putData = {};
          try {
            if (requestBody) {
              putData = JSON.parse(requestBody);
            }
          } catch (e) {
            setGenericError('Invalid JSON in request body');
            logEntry.error = 'Invalid JSON in request body';
            addLogEntry(logEntry);
            return;
          }
          response = await networkService.put(endpoint, putData);
          break;
        case 'PATCH':
          let patchData = {};
          try {
            if (requestBody) {
              patchData = JSON.parse(requestBody);
            }
          } catch (e) {
            setGenericError('Invalid JSON in request body');
            logEntry.error = 'Invalid JSON in request body';
            addLogEntry(logEntry);
            return;
          }
          response = await networkService.patch(endpoint, patchData);
          break;
        case 'DELETE':
          response = await networkService.delete(endpoint);
          break;
        default:
          setGenericError('Unsupported method');
          logEntry.error = 'Unsupported method';
          addLogEntry(logEntry);
          return;
      }
      
      setGenericResponse(response);
      logEntry.response = response;
      
      // If a token is returned, update the token state
      if (response.data?.token) {
        setToken(response.data.token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setGenericError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Function to refresh localStorage items
  const refreshLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const items: LocalStorageItem[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          let type = 'string';
          
          // Try to determine value type
          if (value.startsWith('{') && value.endsWith('}')) {
            try {
              JSON.parse(value);
              type = 'json';
            } catch (e) {
              // Not valid JSON
            }
          } else if (value.startsWith('[') && value.endsWith(']')) {
            try {
              JSON.parse(value);
              type = 'array';
            } catch (e) {
              // Not valid JSON array
            }
          } else if (value === 'true' || value === 'false') {
            type = 'boolean';
          } else if (!isNaN(Number(value))) {
            type = 'number';
          }
          
          items.push({ key, value, type });
        }
      }
      
      setLocalStorageItems(items);
    }
  };
  
  // Initial load of localStorage items
  useEffect(() => {
    refreshLocalStorage();
    
    // Set up a refresh interval
    const intervalId = setInterval(refreshLocalStorage, 3000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to handle item selection for detailed view
  const handleItemSelect = (item: LocalStorageItem) => {
    setSelectedItem(item);
    setEditingKey(item.key);
    
    // If JSON or array, beautify it for editing
    if (item.type === 'json' || item.type === 'array') {
      try {
        const parsedValue = JSON.parse(item.value);
        setEditingValue(JSON.stringify(parsedValue, null, 2));
      } catch {
        setEditingValue(item.value);
      }
    } else {
      setEditingValue(item.value);
    }
  };
  
  // Function to add or update localStorage item
  const handleSaveItem = () => {
    if (!editingKey.trim()) {
      alert('Key cannot be empty');
      return;
    }
    
    let valueToStore = editingValue;
    
    // If it looks like a formatted JSON, minify it before storing
    if ((editingValue.startsWith('{') && editingValue.endsWith('}')) || 
        (editingValue.startsWith('[') && editingValue.endsWith(']'))) {
      try {
        const parsed = JSON.parse(editingValue);
        valueToStore = JSON.stringify(parsed);
      } catch {
        // Not valid JSON, store as is
      }
    }
    
    try {
      localStorage.setItem(editingKey, valueToStore);
      refreshLocalStorage();
      setSelectedItem(null);
      setEditingKey('');
      setEditingValue('');
    } catch (error) {
      alert(`Error saving to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Function to delete a localStorage item
  const handleDeleteItem = (key: string) => {
    if (confirm(`Are you sure you want to delete "${key}" from localStorage?`)) {
      localStorage.removeItem(key);
      refreshLocalStorage();
      
      if (selectedItem && selectedItem.key === key) {
        setSelectedItem(null);
        setEditingKey('');
        setEditingValue('');
      }
    }
  };
  
  // Function to clear all localStorage
  const handleClearLocalStorage = () => {
    if (confirm('Are you sure you want to clear all localStorage items?')) {
      localStorage.clear();
      refreshLocalStorage();
      setSelectedItem(null);
      setEditingKey('');
      setEditingValue('');
    }
  };
  
  // Function to copy value to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  // Function to get a user-friendly display value for the item
  const getDisplayValue = (item: LocalStorageItem): string => {
    if (!item.value) return '';
    
    if (item.type === 'json' || item.type === 'array') {
      try {
        return JSON.stringify(JSON.parse(item.value), null, 2);
      } catch {
        return item.value;
      }
    }
    
    return item.value;
  };

  // Function to get a preview of the value (truncated for display)
  const getValuePreview = (item: LocalStorageItem): string => {
    if (!item.value) return '';
    
    const maxPreviewLength = 30;
    
    if (item.type === 'json') {
      return '{...}';
    } else if (item.type === 'array') {
      return '[...]';
    } else if (item.value.length > maxPreviewLength) {
      return `${item.value.substring(0, maxPreviewLength)}...`;
    }
    
    return item.value;
  };

  // Function to get a descriptive label for the type
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'json': return 'JSON Object';
      case 'array': return 'Array';
      case 'string': return 'String';
      case 'number': return 'Number';
      case 'boolean': return 'Boolean';
      default: return type;
    }
  };
  
  // Handler for creating a constraint
  const handleCreateConstraint = async () => {
    if (!constraintReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/constraints',
      request: { 
        reservable_id: constraintReservableId,
        name: constraintName,
        type: constraintType,
        value: constraintValue
      }
    };
    
    try {
      setConstraintError(null);
      const constraintData: CreateConstraintRequest = { 
        reservable_id: constraintReservableId,
        name: constraintName,
        type: constraintType,
        value: constraintValue
      };
      
      const response = await createConstraint(constraintData);
      setConstraintResponse(response);
      
      // If there's a constraint in the response, capture its ID
      if (response.data && response.data.constraint) {
        setConstraintId(response.data.constraint.id);
      }
      
      // Update log entry with response
      logEntry.response = response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConstraintError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting a specific constraint
  const handleGetConstraint = async () => {
    if (!constraintId) {
      alert('Please enter a Constraint ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/constraints/${constraintId}`
    };
    
    try {
      setConstraintError(null);
      const response = await getConstraint(constraintId);
      setConstraintResponse(response);
      
      // If there's a constraint in the response, update the form fields
      if (response.data && response.data.constraint) {
        const constraint = response.data.constraint;
        setConstraintName(constraint.name);
        setConstraintType(constraint.type);
        setConstraintValue(constraint.value);
        setConstraintReservableId(constraint.reservable_id);
      }
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConstraintError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for updating a constraint
  const handleUpdateConstraint = async () => {
    if (!constraintId) {
      alert('Please enter a Constraint ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'PUT',
      endpoint: `/constraints/${constraintId}`,
      request: { 
        name: constraintName,
        type: constraintType,
        value: constraintValue
      }
    };
    
    try {
      setConstraintError(null);
      const constraintData: UpdateConstraintRequest = { 
        name: constraintName,
        type: constraintType,
        value: constraintValue
      };
      
      const response = await updateConstraint(constraintId, constraintData);
      setConstraintResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConstraintError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for deleting a constraint
  const handleDeleteConstraint = async () => {
    if (!constraintId) {
      alert('Please enter a Constraint ID');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete constraint with ID: ${constraintId}?`)) {
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'DELETE',
      endpoint: `/constraints/${constraintId}`
    };
    
    try {
      setConstraintError(null);
      const response = await deleteConstraint(constraintId);
      setConstraintResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // Clear the constraint ID field on successful deletion
      if (response.success) {
        setConstraintId('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConstraintError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting constraints for a reservable
  const handleGetReservableConstraints = async () => {
    if (!constraintReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/constraints/reservable/${constraintReservableId}`
    };
    
    try {
      setConstraintError(null);
      const response = await getReservableConstraints(constraintReservableId);
      setConstraintResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setConstraintError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for creating a validator
  const handleCreateValidator = async () => {
    if (!validatorReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/validators',
      request: { 
        reservable_id: validatorReservableId,
        description: validatorDescription,
      }
    };
    
    try {
      setValidatorError(null);
      const validatorData: CreateValidatorRequest = { 
        reservable_id: validatorReservableId,
        description: validatorDescription,
      };
      
      const response = await createValidator(validatorData);
      setValidatorResponse(response);
      
      // If there's a validator in the response, capture its ID
      if (response.data) {
        const validatorData = response.data as unknown as Validator;
        setValidatorId(validatorData.id);
      }
      
      // Update log entry with response
      logEntry.response = response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setValidatorError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting a specific validator
  const handleGetValidator = async () => {
    if (!validatorId) {
      alert('Please enter a Validator ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/validators/${validatorId}`
    };
    
    try {
      setValidatorError(null);
      const response = await getValidator(validatorId);
      setValidatorResponse(response);
      
      // If there's a validator in the response, update the form fields
      if (response.data) {
        const validatorData = response.data as unknown as Validator;
        setValidatorDescription(validatorData.description || '');
        setValidatorReservableId(validatorData.reservable_id || '');
        setValidatorIsActive(validatorData.is_active || false);
      }
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setValidatorError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for toggling validator status
  const handleToggleValidatorStatus = async () => {
    if (!validatorId) {
      alert('Please enter a Validator ID');
      return;
    }
    
    const newStatus = !validatorIsActive;
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'PATCH',
      endpoint: `/validators/${validatorId}/status`,
      request: { 
        is_active: newStatus
      }
    };
    
    try {
      setValidatorError(null);
      const statusData: UpdateValidatorStatusRequest = { 
        is_active: newStatus
      };
      
      const response = await toggleValidatorStatus(validatorId, statusData);
      setValidatorResponse(response);
      
      // If successful, update the local status
      if (response.success) {
        setValidatorIsActive(newStatus);
      }
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setValidatorError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for deleting a validator
  const handleDeleteValidator = async () => {
    if (!validatorId) {
      alert('Please enter a Validator ID');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete validator with ID: ${validatorId}?`)) {
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'DELETE',
      endpoint: `/validators/${validatorId}`
    };
    
    try {
      setValidatorError(null);
      const response = await deleteValidator(validatorId);
      setValidatorResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // Clear the validator ID field on successful deletion
      if (response.success) {
        setValidatorId('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setValidatorError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting validators for a reservable
  const handleGetReservableValidators = async () => {
    if (!validatorReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/validators/reservable/${validatorReservableId}`
    };
    
    try {
      setValidatorError(null);
      const response = await getReservableValidators(validatorReservableId);
      setValidatorResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setValidatorError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for creating a reservation
  const handleCreateReservation = async () => {
    if (!reservationReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'POST',
      endpoint: '/reservations',
      request: { 
        reservable_id: reservationReservableId,
        start_time_iso8601: reservationStartTime,
        end_time_iso8601: reservationEndTime,
        notes: reservationNotes || undefined
      }
    };
    
    try {
      setReservationError(null);
      const reservationData: CreateReservationRequest = { 
        reservable_id: reservationReservableId,
        start_time_iso8601: reservationStartTime,
        end_time_iso8601: reservationEndTime
      };
      
      if (reservationNotes) {
        reservationData.notes = reservationNotes;
      }
      
      const response = await createReservation(reservationData);
      setReservationResponse(response);
      
      // If there's a reservation in the response, capture its ID
      const responseData = response.data as any;
      if (responseData?.reservation?.id) {
        setReservationId(responseData.reservation.id);
      }
      
      // Update log entry with response
      logEntry.response = response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservationError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting a specific reservation
  const handleGetReservation = async () => {
    if (!reservationId) {
      alert('Please enter a Reservation ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/reservations/${reservationId}`
    };
    
    try {
      setReservationError(null);
      const response = await getReservation(reservationId);
      setReservationResponse(response);
      
      // If there's a reservation in the response, update the form fields
      if (response.data) {
        const reservation = response.data as unknown as Reservation;
        setReservationReservableId(reservation.reservable_id || '');
        setReservationStartTime(reservation.start_time_iso8601 || '');
        setReservationEndTime(reservation.end_time_iso8601 || '');
        setReservationNotes(reservation.notes || '');
      }
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservationError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for deleting a reservation
  const handleDeleteReservation = async () => {
    if (!reservationId) {
      alert('Please enter a Reservation ID');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete reservation with ID: ${reservationId}?`)) {
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'DELETE',
      endpoint: `/reservations/${reservationId}`
    };
    
    try {
      setReservationError(null);
      const response = await deleteReservation(reservationId);
      setReservationResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
      
      // Clear the reservation ID field on successful deletion
      if (response.success) {
        setReservationId('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservationError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting user's reservations
  const handleGetUserReservations = async () => {
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: '/reservations/user'
    };
    
    try {
      setReservationError(null);
      const response = await getUserReservations();
      setReservationResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservationError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  // Handler for getting reservations for a reservable with optional filters
  const handleGetReservableReservations = async () => {
    if (!reservationReservableId) {
      alert('Please enter a Reservable ID');
      return;
    }
    
    const logEntry: RequestLogEntry = {
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/reservations/reservable/${reservationReservableId}`
    };
    
    try {
      setReservationError(null);
      const response = await getReservableReservations(
        reservationReservableId, 
        filterStartTime || undefined, 
        filterEndTime || undefined
      );
      setReservationResponse(response);
      
      // Update log entry with response
      logEntry.response = response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setReservationError(errorMessage);
      logEntry.error = errorMessage;
    } finally {
      addLogEntry(logEntry);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Service API Testing</h1>
      
      {/* Category Navigation Bar */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {(['auth', 'user', 'reservable', 'constraint', 'validator', 'reservation'] as ApiCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeCategory === category
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Token Management Section */}
      <div className="mb-12 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Authentication Token</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="token">
              JWT Token
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
              rows={3}
              placeholder="Paste your JWT token here"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleSetToken}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Set Token
            </button>
            <button
              onClick={handleClearToken}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Token
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Current token status: {networkService.getToken() ? 'Token set' : 'No token'}</p>
          </div>
        </div>
      </div>
      
      {/* Category-specific API Testing Section */}
      <div className="mb-12 p-6 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} API Testing
        </h2>
        
        {/* Category-specific quick actions */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">Quick Actions:</h3>
          <div className="flex flex-wrap gap-2">
            {activeCategory === 'auth' && (
              <>
                <button
                  onClick={() => {
                    setLoginEmail('user@example.com');
                    setGenericResponse(null);
                    setGenericError(null);
                    setLoginResponse(null);
                    setLoginError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Set Email
                </button>
                <button
                  onClick={() => {
                    handleLogin();
                  }}
                  className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  Login (Direct)
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  Logout
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/auth/login');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      email: 'user@example.com'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Login (Generic)
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/auth/register');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      email: 'newuser@example.com',
                      password: 'password123',
                      name: 'New User'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Register
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/auth/logout');
                    setMethod('POST');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Logout (Generic)
                </button>
              </>
            )}
            
            {activeCategory === 'user' && (
              <>
                <button
                  onClick={() => {
                    setEndpoint('/api/users');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  List Users
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/users');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      email: 'newuser@example.com',
                      name: 'New User'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Create User
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/users/profile');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Get Profile
                </button>
              </>
            )}
            
            {activeCategory === 'reservable' && (
              <>
                <button
                  onClick={handleGetUserReservables}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  List My Reservables
                </button>
                <button
                  onClick={handleCreateReservable}
                  className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                >
                  Create Reservable
                </button>
                <button
                  onClick={() => {
                    if (reservableId) {
                      handleGetReservable();
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Get By ID
                </button>
                <button
                  onClick={() => {
                    if (reservableId) {
                      handleUpdateReservable();
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    if (reservableId) {
                      handleDeleteReservable();
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    if (reservableId) {
                      handleGetReservableChildren();
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                >
                  Get Children
                </button>
                <button
                  onClick={() => {
                    if (parentId && childId) {
                      handleAddToCollection();
                    } else {
                      alert('Please enter both Parent and Child IDs');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                >
                  Add To Collection
                </button>
                <button
                  onClick={() => {
                    if (parentId && childId) {
                      handleRemoveFromCollection();
                    } else {
                      alert('Please enter both Parent and Child IDs');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                >
                  Remove From Collection
                </button>
              </>
            )}
            
            {activeCategory === 'reservation' && (
              <>
                <button
                  onClick={() => {
                    setEndpoint('/api/reservations');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  List All Reservations
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/reservations/user');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  My Reservations
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/reservations');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      reservable_id: '',
                      start_time_iso8601: new Date(Date.now() + 3600000).toISOString(),
                      end_time_iso8601: new Date(Date.now() + 7200000).toISOString(),
                      notes: 'Meeting reservation'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Create Reservation
                </button>
                <button
                  onClick={() => {
                    if (reservationReservableId) {
                      setEndpoint(`/api/reservations/reservable/${reservationReservableId}`);
                      setMethod('GET');
                      setRequestBody('');
                      setGenericResponse(null);
                      setGenericError(null);
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Get By Reservable
                </button>
              </>
            )}
            
            {activeCategory === 'constraint' && (
              <>
                <button
                  onClick={() => {
                    setEndpoint('/api/constraints');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  List All Constraints
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/constraints');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      reservable_id: '',
                      name: 'Time Limit',
                      type: ConstraintType.STRING,
                      value: '2h'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Create Constraint
                </button>
                <button
                  onClick={() => {
                    if (constraintReservableId) {
                      setEndpoint(`/api/constraints/reservable/${constraintReservableId}`);
                      setMethod('GET');
                      setRequestBody('');
                      setGenericResponse(null);
                      setGenericError(null);
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Get By Reservable
                </button>
                <button
                  onClick={() => {
                    setConstraintName('Time Limit');
                    setConstraintType(ConstraintType.TIME);
                    setConstraintValue('02:00:00');
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Time Limit Example
                </button>
                <button
                  onClick={() => {
                    setConstraintName('Capacity');
                    setConstraintType(ConstraintType.INTEGER);
                    setConstraintValue('10');
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Capacity Example
                </button>
                <button
                  onClick={() => {
                    setConstraintName('Availability Schedule');
                    setConstraintType(ConstraintType.STRING);
                    setConstraintValue(JSON.stringify({
                      weekdays: {
                        monday: { start: "09:00", end: "17:00" },
                        tuesday: { start: "09:00", end: "17:00" },
                        wednesday: { start: "09:00", end: "17:00" },
                        thursday: { start: "09:00", end: "17:00" },
                        friday: { start: "09:00", end: "17:00" }
                      }
                    }));
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Availability Example
                </button>
                <button
                  onClick={() => {
                    setConstraintName('Contact Email');
                    setConstraintType(ConstraintType.EMAIL);
                    setConstraintValue('contact@example.com');
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Email Example
                </button>
              </>
            )}
            
            {activeCategory === 'validator' && (
              <>
                <button
                  onClick={() => {
                    setEndpoint('/api/validators');
                    setMethod('GET');
                    setRequestBody('');
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  List Validators
                </button>
                <button
                  onClick={() => {
                    setEndpoint('/api/validators');
                    setMethod('POST');
                    setRequestBody(JSON.stringify({
                      reservable_id: '',
                      description: 'Check availability'
                    }, null, 2));
                    setGenericResponse(null);
                    setGenericError(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Create Validator
                </button>
                <button
                  onClick={() => {
                    if (validatorReservableId) {
                      setEndpoint(`/api/validators/reservable/${validatorReservableId}`);
                      setMethod('GET');
                      setRequestBody('');
                      setGenericResponse(null);
                      setGenericError(null);
                    } else {
                      alert('Please enter a Reservable ID first');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Get By Reservable
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/4">
              <label className="block text-sm font-medium mb-1" htmlFor="method">
                Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="w-3/4">
              <label className="block text-sm font-medium mb-1" htmlFor="endpoint">
                Endpoint
              </label>
              <input
                id="endpoint"
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="/api/endpoint"
              />
            </div>
          </div>
          
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="requestBody">
                Request Body (JSON)
              </label>
              <textarea
                id="requestBody"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-xs"
                rows={5}
                placeholder='{ "key": "value" }'
              />
            </div>
          )}
          
          <button
            onClick={handleGenericRequest}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Send Request
          </button>
          
          <ResponseDisplay data={genericResponse} error={genericError} />
        </div>
      </div>
      
      {/* Show user-specific section only when user category is active */}
      {activeCategory === 'user' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Create User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">
                  Email (required)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="John Doe"
                />
              </div>
              
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create User
              </button>
              
              <ResponseDisplay data={createUserResponse} error={createUserError} />
            </div>
          </div>
          
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Get User Profile</h2>
            <p className="text-sm text-gray-600 mb-4">
              This endpoint requires authentication. Make sure you have a valid token.
            </p>
            
            <button
              onClick={handleGetProfile}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Get Profile
            </button>
            
            <ResponseDisplay data={profileResponse} error={profileError} />
          </div>
        </>
      )}
      
      {/* Show auth-specific section only when auth category is active */}
      {activeCategory === 'auth' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="loginEmail">
                  Email
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Login
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <p>Note: After successful login, the authentication token will be stored and available in the Token Management section.</p>
              </div>
              
              <ResponseDisplay data={loginResponse} error={loginError} />
            </div>
          </div>
        </>
      )}
      
      {/* Show reservable-specific section only when reservable category is active */}
      {activeCategory === 'reservable' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Reservable Management</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Reservable Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservableName">
                        Name (required)
                      </label>
                      <input
                        id="reservableName"
                        type="text"
                        value={reservableName}
                        onChange={(e) => setReservableName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Meeting Room A"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservableDescription">
                        Description (optional)
                      </label>
                      <textarea
                        id="reservableDescription"
                        value={reservableDescription}
                        onChange={(e) => setReservableDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Conference room for team meetings"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservableId">
                        Reservable ID (for get/update/delete)
                      </label>
                      <input
                        id="reservableId"
                        type="text"
                        value={reservableId}
                        onChange={(e) => setReservableId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateReservable}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Create
                      </button>
                      
                      <button
                        onClick={handleGetReservable}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={!reservableId}
                      >
                        Get
                      </button>
                      
                      <button
                        onClick={handleUpdateReservable}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        disabled={!reservableId}
                      >
                        Update
                      </button>
                      
                      <button
                        onClick={handleDeleteReservable}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        disabled={!reservableId}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Collection Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="parentId">
                        Parent ID
                      </label>
                      <input
                        id="parentId"
                        type="text"
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Parent Reservable ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="childId">
                        Child ID
                      </label>
                      <input
                        id="childId"
                        type="text"
                        value={childId}
                        onChange={(e) => setChildId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Child Reservable ID"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddToCollection}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        disabled={!parentId || !childId}
                      >
                        Add to Collection
                      </button>
                      
                      <button
                        onClick={handleRemoveFromCollection}
                        className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                        disabled={!parentId || !childId}
                      >
                        Remove from Collection
                      </button>
                    </div>
                    
                    <div>
                      <button
                        onClick={() => handleGetUserReservables()}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full"
                      >
                        List All My Reservables
                      </button>
                    </div>
                    
                    <div>
                      <button
                        onClick={handleGetReservableChildren}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
                        disabled={!reservableId}
                      >
                        Get Children
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <ResponseDisplay data={reservableResponse} error={reservableError} />
            </div>
          </div>
        </>
      )}
      
      {/* Show constraint-specific section only when constraint category is active */}
      {activeCategory === 'constraint' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Constraint Management</h2>
            <div className="space-y-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Quick Actions:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCreateConstraint}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Create Constraint
                  </button>
                  <button
                    onClick={handleGetConstraint}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Get Constraint
                  </button>
                  <button
                    onClick={handleUpdateConstraint}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                  >
                    Update Constraint
                  </button>
                  <button
                    onClick={handleDeleteConstraint}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete Constraint
                  </button>
                  <button
                    onClick={handleGetReservableConstraints}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                  >
                    Get Reservable Constraints
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Constraint Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="constraintReservableId">
                        Reservable ID (required)
                      </label>
                      <input
                        id="constraintReservableId"
                        type="text"
                        value={constraintReservableId}
                        onChange={(e) => setConstraintReservableId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Reservable ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="constraintName">
                        Name (required)
                      </label>
                      <input
                        id="constraintName"
                        type="text"
                        value={constraintName}
                        onChange={(e) => setConstraintName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Time Limit"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="constraintType">
                        Type (required)
                      </label>
                      <select
                        id="constraintType"
                        value={constraintType}
                        onChange={(e) => setConstraintType(e.target.value as ConstraintType)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value={ConstraintType.DATE}>date</option>
                        <option value={ConstraintType.TIME}>time</option>
                        <option value={ConstraintType.INTEGER}>integer</option>
                        <option value={ConstraintType.STRING}>string</option>
                        <option value={ConstraintType.BOOLEAN}>boolean</option>
                        <option value={ConstraintType.EMAIL}>email</option>
                        <option value={ConstraintType.PHONE}>phone</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="constraintValue">
                        Value (required)
                      </label>
                      <input
                        id="constraintValue"
                        type="text"
                        value={constraintValue}
                        onChange={(e) => setConstraintValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="2h"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        For time_limit: use format like "2h", "30m"<br />
                        For capacity: use numbers like "10", "50"<br />
                        For availability: use JSON format
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="constraintId">
                        Constraint ID (for get/update/delete)
                      </label>
                      <input
                        id="constraintId"
                        type="text"
                        value={constraintId}
                        onChange={(e) => setConstraintId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateConstraint}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Create
                      </button>
                      
                      <button
                        onClick={handleGetConstraint}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={!constraintId}
                      >
                        Get
                      </button>
                      
                      <button
                        onClick={handleUpdateConstraint}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        disabled={!constraintId}
                      >
                        Update
                      </button>
                      
                      <button
                        onClick={handleDeleteConstraint}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        disabled={!constraintId}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div>
                      <button
                        onClick={handleGetReservableConstraints}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full"
                        disabled={!constraintReservableId}
                      >
                        Get Reservable Constraints
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Available Constraint Types:</h4>
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li><strong>{ConstraintType.DATE}</strong>: Date values (YYYY-MM-DD)</li>
                        <li><strong>{ConstraintType.TIME}</strong>: Time values (HH:MM:SS)</li>
                        <li><strong>{ConstraintType.INTEGER}</strong>: Whole number values</li>
                        <li><strong>{ConstraintType.STRING}</strong>: Text values</li>
                        <li><strong>{ConstraintType.BOOLEAN}</strong>: True/false values</li>
                        <li><strong>{ConstraintType.EMAIL}</strong>: Email address format</li>
                        <li><strong>{ConstraintType.PHONE}</strong>: Phone number format</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <ResponseDisplay data={constraintResponse} error={constraintError} />
            </div>
          </div>
        </>
      )}
      
      {/* Show validator-specific section only when validator category is active */}
      {activeCategory === 'validator' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Validator Management</h2>
            <div className="space-y-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Quick Actions:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCreateValidator}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Create Validator
                  </button>
                  <button
                    onClick={handleGetValidator}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Get Validator
                  </button>
                  <button
                    onClick={handleToggleValidatorStatus}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={handleDeleteValidator}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete Validator
                  </button>
                  <button
                    onClick={handleGetReservableValidators}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                  >
                    Get Reservable Validators
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Validator Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="validatorReservableId">
                        Reservable ID (required)
                      </label>
                      <input
                        id="validatorReservableId"
                        type="text"
                        value={validatorReservableId}
                        onChange={(e) => setValidatorReservableId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Reservable ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="validatorDescription">
                        Description (required)
                      </label>
                      <input
                        id="validatorDescription"
                        type="text"
                        value={validatorDescription}
                        onChange={(e) => setValidatorDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Check availability"
                      />
                    </div>
                    
                    {validatorId && (
                      <div className="flex items-center">
                        <span className="block text-sm font-medium mr-2">Status:</span>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-1 ${validatorIsActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-sm">{validatorIsActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="validatorId">
                        Validator ID (for get/update/delete)
                      </label>
                      <input
                        id="validatorId"
                        type="text"
                        value={validatorId}
                        onChange={(e) => setValidatorId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateValidator}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Create
                      </button>
                      
                      <button
                        onClick={handleGetValidator}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={!validatorId}
                      >
                        Get
                      </button>
                      
                      <button
                        onClick={handleToggleValidatorStatus}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        disabled={!validatorId}
                      >
                        Toggle Status
                      </button>
                      
                      <button
                        onClick={handleDeleteValidator}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        disabled={!validatorId}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div>
                      <button
                        onClick={handleGetReservableValidators}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full"
                        disabled={!validatorReservableId}
                      >
                        Get Reservable Validators
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Available Validator Statuses:</h4>
                      <ul className="text-xs space-y-1 text-gray-600">
                        <li><strong>{true}</strong>: Active</li>
                        <li><strong>{false}</strong>: Inactive</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <ResponseDisplay data={validatorResponse} error={validatorError} />
            </div>
          </div>
        </>
      )}
      
      {/* Show reservation-specific section only when reservation category is active */}
      {activeCategory === 'reservation' && (
        <>
          <div className="mb-12 p-6 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Reservation Management</h2>
            <div className="space-y-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Quick Actions:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCreateReservation}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Create Reservation
                  </button>
                  <button
                    onClick={handleGetReservation}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Get Reservation
                  </button>
                  <button
                    onClick={handleDeleteReservation}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete Reservation
                  </button>
                  <button
                    onClick={handleGetUserReservations}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                  >
                    My Reservations
                  </button>
                  <button
                    onClick={handleGetReservableReservations}
                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                  >
                    Get Reservable Reservations
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Reservation Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservationReservableId">
                        Reservable ID (required)
                      </label>
                      <input
                        id="reservationReservableId"
                        type="text"
                        value={reservationReservableId}
                        onChange={(e) => setReservationReservableId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Reservable ID"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservationStartTime">
                        Start Time (required)
                      </label>
                      <input
                        id="reservationStartTime"
                        type="datetime-local"
                        value={reservationStartTime.substring(0, 16)}
                        onChange={(e) => setReservationStartTime(new Date(e.target.value).toISOString())}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservationEndTime">
                        End Time (required)
                      </label>
                      <input
                        id="reservationEndTime"
                        type="datetime-local"
                        value={reservationEndTime.substring(0, 16)}
                        onChange={(e) => setReservationEndTime(new Date(e.target.value).toISOString())}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservationNotes">
                        Notes (optional)
                      </label>
                      <textarea
                        id="reservationNotes"
                        value={reservationNotes}
                        onChange={(e) => setReservationNotes(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Meeting notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Actions & Filters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="reservationId">
                        Reservation ID (for get/delete)
                      </label>
                      <input
                        id="reservationId"
                        type="text"
                        value={reservationId}
                        onChange={(e) => setReservationId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="123e4567-e89b-12d3-a456-426614174000"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateReservation}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Create
                      </button>
                      
                      <button
                        onClick={handleGetReservation}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={!reservationId}
                      >
                        Get
                      </button>
                      
                      <button
                        onClick={handleDeleteReservation}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        disabled={!reservationId}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div>
                      <button
                        onClick={handleGetUserReservations}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full mb-2"
                      >
                        Get My Reservations
                      </button>
                      <button
                        onClick={handleGetReservableReservations}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full"
                        disabled={!reservationReservableId}
                      >
                        Get Reservable Reservations
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Filters (For Reservable Reservations):</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1" htmlFor="filterStartTime">
                            Filter Start Time (optional)
                          </label>
                          <input
                            id="filterStartTime"
                            type="datetime-local"
                            value={filterStartTime}
                            onChange={(e) => setFilterStartTime(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" htmlFor="filterEndTime">
                            Filter End Time (optional)
                          </label>
                          <input
                            id="filterEndTime"
                            type="datetime-local"
                            value={filterEndTime}
                            onChange={(e) => setFilterEndTime(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <ResponseDisplay data={reservationResponse} error={reservationError} />
            </div>
          </div>
        </>
      )}
      
      {/* Tools & Developer Features Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Developer Tools</h2>
        
        {/* LocalStorage Section */}
        <div className="mb-12 p-6 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Browser LocalStorage</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowLocalStorage(!showLocalStorage)}
                className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                {showLocalStorage ? 'Hide' : 'Show'}
              </button>
              <button 
                onClick={refreshLocalStorage}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                title="Refresh LocalStorage items"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {showLocalStorage && (
            <div>
              <div className="flex justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {localStorageItems.length} item(s) in localStorage
                </p>
                <button
                  onClick={handleClearLocalStorage}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left panel - List of items */}
                <div className="w-full md:w-1/2 border border-gray-200 rounded-md p-2 max-h-96 overflow-y-auto">
                  {localStorageItems.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No items in localStorage</p>
                  ) : (
                    <ul className="space-y-1">
                      {localStorageItems.map((item, idx) => (
                        <li 
                          key={idx} 
                          onClick={() => handleItemSelect(item)}
                          className={`flex flex-col p-2 rounded-md cursor-pointer text-sm hover:bg-gray-100 ${
                            selectedItem?.key === item.key ? 'bg-blue-50 border border-blue-200' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                item.type === 'json' ? 'bg-green-500' :
                                item.type === 'array' ? 'bg-purple-500' :
                                item.type === 'boolean' ? 'bg-yellow-500' :
                                item.type === 'number' ? 'bg-blue-500' :
                                'bg-gray-500'
                              }`}></span>
                              <span className="font-mono font-medium">{item.key}</span>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.value);
                                }}
                                className="text-blue-500 hover:text-blue-700 text-xs"
                                title="Copy value"
                              >
                                📋
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.key);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                                title="Delete item"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 flex items-center">
                            <span className="mr-2 px-1 bg-gray-100 rounded text-xxs">{getTypeLabel(item.type)}</span>
                            <span className="font-mono truncate">{getValuePreview(item)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Right panel - Edit item */}
                <div className="w-full md:w-1/2 border border-gray-200 rounded-md p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="localStorageKey">
                        Key
                      </label>
                      <input
                        id="localStorageKey"
                        type="text"
                        value={editingKey}
                        onChange={(e) => setEditingKey(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="item_key"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium" htmlFor="localStorageValue">
                          Value
                        </label>
                        {selectedItem && (
                          <div className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {getTypeLabel(selectedItem.type)}
                          </div>
                        )}
                      </div>
                      <textarea
                        id="localStorageValue"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                        rows={8}
                        placeholder="item_value"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSaveItem}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        {selectedItem ? 'Update Item' : 'Add Item'}
                      </button>
                      
                      {selectedItem && (
                        <>
                          <button
                            onClick={() => copyToClipboard(editingValue)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            title="Copy value to clipboard"
                          >
                            Copy Value
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedItem(null);
                              setEditingKey('');
                              setEditingValue('');
                            }}
                            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                    
                    {selectedItem && selectedItem.type === 'json' && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                        <p className="mb-1">Tips for JSON:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>JSON is automatically formatted for readability</li>
                          <li>Edits will be validated before saving</li>
                          <li>Will be minified when stored in localStorage</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Request Logs Section */}
        <div className="mt-12 p-6 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Request Logs</h3>
            <button 
              onClick={() => setShowLogs(!showLogs)}
              className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          </div>
          
          {showLogs && (
            <div className="space-y-4">
              {requestLogs.length === 0 ? (
                <p className="text-gray-500">No requests logged yet.</p>
              ) : (
                requestLogs.map((log, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded mr-2 ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          log.method === 'POST' ? 'bg-green-100 text-green-800' :
                          log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          log.method === 'PATCH' ? 'bg-purple-100 text-purple-800' :
                          log.method === 'DELETE' ? 'bg-red-100 text-red-800' : ''
                        }`}>
                          {log.method}
                        </span>
                        <span className="font-mono text-sm">{log.endpoint}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {log.request && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">Request:</h4>
                        <pre className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
                          {JSON.stringify(log.request, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {log.response && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">Response:</h4>
                        <pre className="text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {log.error && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-red-500 mb-1">Error:</h4>
                        <pre className="text-xs bg-red-50 text-red-600 p-2 rounded-md overflow-auto max-h-32">
                          {log.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 