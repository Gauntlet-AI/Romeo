'use client';

import React, { useEffect, useState } from 'react';
import Calendar, { CalendarProps } from 'react-calendar';
import TimePicker from '@/app/components/TimePicker';
import { Reservable } from '@/types/reservable.type';
import { Reservation } from '@/types/reservation.type';
import styles from './styles.module.css';
import 'react-calendar/dist/Calendar.css';

// Dummy data for demonstration
const DUMMY_RESERVABLE: Reservable = {
  id: 'res-001',
  name: 'Conference Room A',
  description: 'Main conference room on first floor',
  user_id: 'user-001',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Function to generate dummy reservations
const generateDummyReservations = (): Reservation[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const reservations: Reservation[] = [
    {
      id: 'rsv-001',
      reservable_id: 'res-001',
      user_id: 'user-001',
      start_time_standard: '10:00 AM',
      end_time_standard: '11:30 AM',
      start_time_iso8601: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
      end_time_iso8601: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
      constraint_inputs: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'rsv-002',
      reservable_id: 'res-001',
      user_id: 'user-003',
      start_time_standard: '2:00 PM',
      end_time_standard: '3:30 PM',
      start_time_iso8601: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
      end_time_iso8601: new Date(today.setHours(15, 30, 0, 0)).toISOString(),
      constraint_inputs: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'rsv-003',
      reservable_id: 'res-002',
      user_id: 'user-003',
      start_time_standard: '9:00 AM',
      end_time_standard: '10:00 AM',
      start_time_iso8601: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
      end_time_iso8601: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
      constraint_inputs: {},
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
        id: 'rsv-004',
        reservable_id: 'res-001',
        user_id: 'user-002',
        start_time_standard: '2:00 PM',
        end_time_standard: '3:40 PM',
        start_time_iso8601: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        end_time_iso8601: new Date(today.setHours(15, 50, 0, 0)).toISOString(),
        constraint_inputs: {},
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
    },
    {
        id: 'rsv-005',
        reservable_id: 'res-001',
        user_id: 'user-002',
        start_time_standard: '2:00 PM',
        end_time_standard: '3:40 PM',
        start_time_iso8601: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        end_time_iso8601: new Date(today.setHours(17, 0, 0, 0)).toISOString(),
        constraint_inputs: {},
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
    }
  ];
  
  return reservations;
};

// Generate dummy child reservables
const DUMMY_CHILD_RESERVABLES: Reservable[] = [
  {
    id: 'res-002',
    name: 'Projector',
    user_id: 'user-001',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'res-003',
    name: 'Whiteboard',
    user_id: 'user-001',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'res-004',
    name: 'Video Conference System',
    user_id: 'user-001',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }
];

export default function ReservablePage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservable, setReservable] = useState<Reservable | null>(null);
  const [childReservables, setChildReservables] = useState<Reservable[]>([]);

  const reservableId = React.use(params);
  
  useEffect(() => {
    // In a real app, we would fetch data from API
    // For now, simulate API call with the dummy data
    setTimeout(() => {
      setReservable(DUMMY_RESERVABLE);
      setReservations(generateDummyReservations());
      setChildReservables(DUMMY_CHILD_RESERVABLES);
    }, 300);
  }, [reservableId]);

  if (!reservable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    .filter(reservation => reservation.reservable_id === reservable.id);

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
      <h1 className="text-3xl font-bold mb-6">{reservable.name}</h1>
      <p className="text-gray-600 mb-8">{reservable.description}</p>
      
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
            title={`${reservable.name} - Schedule`}
            reservations={filteredParentReservations}
            selectedDate={selectedDate}
            onCreateReservation={handleCreateReservation}
          />
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Child Reservables</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {childReservables.map(childReservable => (
            <TimePicker
              key={childReservable.id}
              title={childReservable.name}
              reservations={getFilteredChildReservations(childReservable.id)}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 