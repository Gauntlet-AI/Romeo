'use client';

import React, { useEffect, useState } from 'react';
import Calendar, { CalendarProps } from 'react-calendar';
import TimePicker from '@/app/components/TimePicker';
import { Reservable } from '@/types/reservable.type';
import { Reservation } from '@/types/reservation.type';
import styles from '@/styles/styles.module.css';
import 'react-calendar/dist/Calendar.css';
import { getReservableReservations } from '@/services/reservationService';
import { getReservable, getReservableChildren } from '@/services/reservableService';
import { ApiResponse } from '@/services/networkService';
import { isAuthenticated } from '@/services/authService';
import { createUser, getUserProfile } from '@/services/userService';
import { User } from '@/types';
import LoginButton from '@/app/components/LoginButton';

export default function ReservablePage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservable, setReservable] = useState<Reservable | null>(null);
  const [childReservables, setChildReservables] = useState<Reservable[]>([]);
  
  // State variables
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedDateRange, setLoadedDateRange] = useState<{start: Date; end: Date} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const reservableParams = React.use(params);
  
  // Function to generate a UUID v4
  const generateUUID = (): string => {
    return crypto.randomUUID();
  };
  
  // Function to create a random user if not authenticated
  const checkAndCreateUser = async () => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        // Generate a unique email with UUID
        const randomEmail = `user-${generateUUID()}@romeo.ai`;

        console.log('randomEmail', randomEmail);
        
        // Create a new user
        const createUserResponse = await createUser({ email: randomEmail });
        
        if (createUserResponse.success && createUserResponse.data) {
          console.log('Created anonymous user:', createUserResponse.data);
          // The response contains user data under the 'user' key
          if (createUserResponse.data.user) {
            setCurrentUser(createUserResponse.data.user);
          }
        } else {
          console.error('Failed to create anonymous user:', createUserResponse.errors);
        }
      } else {
        const userProfileResponse = await getUserProfile();
        if (userProfileResponse.success && userProfileResponse.data) {
          setCurrentUser(userProfileResponse.data.user);
        } else {
          console.error('Failed to get user profile:', userProfileResponse.errors);
        }
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
    }
  };
  
  // Function to get date range (±5 days from a given date)
  const getDateRange = (date: Date) => {
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 5);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 5);
    endDate.setHours(23, 59, 59, 999);
    
    return { start: startDate, end: endDate };
  };
  
  // Check if a date is within the loaded range
  const isDateInLoadedRange = (date: Date): boolean => {
    if (!loadedDateRange) return false;
    
    return date >= loadedDateRange.start && date <= loadedDateRange.end;
  };
  
  // Function to load all necessary data
  const loadReservableData = async (id: string, forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get date range
      const dateRange = getDateRange(selectedDate);
      
      // Fetch reservable data
      const reservableResponse = await getReservable(id);
      if (reservableResponse.success && reservableResponse.data?.reservable) {
        setReservable(reservableResponse.data.reservable);
      } else {
        setError("Could not load reservable data. Please try again later.");
        return; // Exit early if we can't load the main reservable
      }
      
      // Fetch child reservables
      const childrenResponse = await getReservableChildren(id);
      if (childrenResponse.success && childrenResponse.data?.children) {
        setChildReservables(childrenResponse.data.children);
      } else {
        setError("Could not load child reservables. Some data may be missing.");
        // Continue since this isn't a critical failure
      }
      
      // Fetch reservations for parent reservable
      const reservationsResponse = await getReservableReservations(
        id,
        dateRange.start.toISOString(),
        dateRange.end.toISOString()
      );
      
      let allReservations: Reservation[] = [];
      
      if (reservationsResponse.success && reservationsResponse.data) {
        allReservations = [...reservationsResponse.data.reservations];
        
        setLoadedDateRange(dateRange);
      } else {
        setError("Could not load reservation data. Some data may be missing.");
        // Continue since this isn't a critical failure
      }
      
      // Fetch reservations for each child reservable and add them to the state
      if (childrenResponse.success && childrenResponse.data?.children) {
        const childReservationPromises = childrenResponse.data.children.map((child: Reservable) => 
          getReservableReservations(
            child.id,
            dateRange.start.toISOString(),
            dateRange.end.toISOString()
          )
        );
        
        const childReservationResponses = await Promise.all(childReservationPromises);
        
        // Combine all child reservations with parent reservations
        childReservationResponses.forEach((response: ApiResponse<Reservation[]>) => {
          if (response.success && response.data?.reservations) {
            allReservations = [...allReservations, ...response.data.reservations];
          }
        });
      }
      
      setReservations(allReservations);
    } catch (error) {
      console.error('Error loading reservable data:', error);
      setError("An error occurred while loading data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load additional reservations for a specific date if not in range
  const loadReservationsForDate = async (date: Date) => {
    if (isDateInLoadedRange(date) || !reservable) {
      return; // Date is already loaded or no reservable data
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get new date range
      const dateRange = getDateRange(date);
      
      // Fetch reservations for parent reservable
      const reservationsResponse = await getReservableReservations(
        reservable.id,
        dateRange.start.toISOString(),
        dateRange.end.toISOString()
      );
      
      // Fetch reservations for each child reservable
      const childReservationPromises = childReservables.map((child: Reservable) => 
        getReservableReservations(
          child.id,
          dateRange.start.toISOString(),
          dateRange.end.toISOString()
        )
      );
      
      const responses = await Promise.all([
        reservationsResponse,
        ...childReservationPromises
      ]);
      
      // Combine all reservations
      const newReservations: Reservation[] = [];
      
      responses.forEach((response: ApiResponse<Reservation[]>) => {
        if (response.success && response.data?.reservations) {
          newReservations.push(...response.data.reservations);
        }
      });
      
      // Merge with existing reservations, avoiding duplicates by ID
      const existingIds = new Set(reservations.map(r => r.id));
      const uniqueNewReservations = newReservations.filter(r => !existingIds.has(r.id));
      
      setReservations(prev => [...prev, ...uniqueNewReservations]);
      
      // Update loaded date range
      if (loadedDateRange) {
        const newStartDate = new Date(Math.min(loadedDateRange.start.getTime(), dateRange.start.getTime()));
        const newEndDate = new Date(Math.max(loadedDateRange.end.getTime(), dateRange.end.getTime()));
        setLoadedDateRange({ start: newStartDate, end: newEndDate });
      } else {
        setLoadedDateRange(dateRange);
      }
    } catch (error) {
      console.error('Error loading reservations for date:', error);
      setError("An error occurred while loading date-specific reservations.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check authentication and create user if needed on component mount
  useEffect(() => {
    checkAndCreateUser();
  }, []);
  
  useEffect(() => {
    console.log('currentUser', currentUser);
    if (!currentUser) {
      return;
    }

    if (reservableParams?.id) {
      loadReservableData(reservableParams.id);
    }
  }, [reservableParams, currentUser]);
  
  // Handle date selection - fetch data if needed
  useEffect(() => {
    if (reservable && !isDateInLoadedRange(selectedDate)) {
      loadReservationsForDate(selectedDate);
    }
  }, [selectedDate, reservable]);

  if (isLoading && !reservable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reservable && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Failed to load reservable data. Please try again later.</p>
        </div>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => reservableParams?.id && loadReservableData(reservableParams.id)}
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter reservations by selected date
  const filterReservationsByDate = (reservs: Reservation[]) => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    return reservs.filter(reservation => {
      const startDate = new Date(reservation.start_time_iso8601);
      const endDate = new Date(reservation.end_time_iso8601);
      
      // Convert to date strings for comparison
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Include if reservation starts or ends on the selected date
      // or if it spans across the selected date
      return startDateStr === selectedDateStr || 
             endDateStr === selectedDateStr || 
             (startDate < selectedDate && endDate > selectedDate);
    });
  };

  // Filter reservations for the parent reservable
  const parentReservations = reservations
    .filter(reservation => reservation.reservable_id === reservable?.id);

  // Get date-filtered reservations for the parent
  const filteredParentReservations = filterReservationsByDate(parentReservations);

  // Get filtered reservations for each child reservable
  const getFilteredChildReservations = (childId: string) => {
    const childReservations = reservations
      .filter(reservation => reservation.reservable_id === childId);
      
    return filterReservationsByDate(childReservations);
  };

  // Handle calendar date change - properly typed for react-calendar
  const handleDateChange: CalendarProps['onChange'] = (value) => {
    // Value can be Date | Date[] | null
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      // If it's a range or array, use the first date
      setSelectedDate(value[0]);
    }
  };

  const handleCreateReservation = (start: Date, end: Date) => {
    console.log('Creating reservation:', { start, end });
    // In a real app, you would send this data to the server
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Login Button in top right */}
      <div className="flex justify-end mb-4">
        <LoginButton />
      </div>
      
      {isLoading && reservable && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 bg-blue-500 text-white">
          Loading reservation data...
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p>{error}</p>
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-6">{reservable?.name}</h1>
      <p className="text-gray-600 mb-8">{reservable?.description}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-1">
          <div className={styles['calendar-container']}>
            <Calendar 
              onChange={handleDateChange} 
              value={selectedDate}
            />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <TimePicker
            title={`${reservable?.name || 'Reservable'} - Schedule`}
            reservations={filteredParentReservations}
            selectedDate={selectedDate}
            onCreateReservation={handleCreateReservation}
          />
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Child Reservables</h2>
        {childReservables.length === 0 ? (
          <p className="text-gray-500">No child reservables found</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {childReservables.map(childReservable => (
              <TimePicker
                key={childReservable.id}
                title={childReservable.name}
                reservations={getFilteredChildReservations(childReservable.id)}
                selectedDate={selectedDate}
                onCreateReservation={handleCreateReservation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 