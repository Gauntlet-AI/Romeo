import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Reservation } from '@/types/reservation.type';

interface TimePickerProps {
  title: string;
  reservations: Reservation[];
  selectedDate: Date;
}

// Helper function to group overlapping reservations
interface ReservationSlot {
  reservation: Reservation;
  column: number;
}

interface TimeSlot {
  hour: number;
  displayTime: string;
}

interface ReservationBlobProps {
  reservation: Reservation;
  style: {
    top: string;
    height: string;
  };
}

// Component for a single reservation blob
const ReservationBlob: React.FC<ReservationBlobProps> = ({ reservation, style }) => {
  return (
    <div
      className="absolute left-0 right-0 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 overflow-hidden"
      style={{ ...style, minHeight: '30px' }}
    >
      <div className="font-medium text-sm text-blue-800 truncate">
        {new Date(reservation.start_time_iso8601).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
        {new Date(reservation.end_time_iso8601).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {reservation.notes && (
        <div className="text-xs text-gray-600 truncate mt-1">
          {reservation.notes}
        </div>
      )}
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({
  title,
  reservations,
  selectedDate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hiddenAbove, setHiddenAbove] = useState(0);
  const [hiddenBelow, setHiddenBelow] = useState(0);
  
  // Generate time slots for 24 hours
  const timeSlots: TimeSlot[] = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const hour = i;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return {
        hour,
        displayTime: `${displayHour}:00 ${ampm}`
      };
    });
  }, []);

  // Calculate positions and groupings for reservations
  const processedReservations = useMemo(() => {
    if (reservations.length === 0) return [];
    
    // Sort reservations by start time
    const sortedReservations = [...reservations].sort((a, b) => 
      new Date(a.start_time_iso8601).getTime() - new Date(b.start_time_iso8601).getTime()
    );
    
    const result: ReservationSlot[] = [];
    const columns: { endTime: Date; reservation: Reservation }[] = [];
    
    for (const res of sortedReservations) {
      const startTime = new Date(res.start_time_iso8601);
      const endTime = new Date(res.end_time_iso8601);
      
      // Find a column where this reservation can fit
      let columnIndex = columns.findIndex(col => 
        new Date(col.endTime) <= startTime
      );
      
      if (columnIndex === -1) {
        // Need a new column
        columnIndex = columns.length;
        columns.push({ endTime, reservation: res });
      } else {
        // Update the end time of this column
        columns[columnIndex].endTime = endTime;
      }
      
      result.push({
        reservation: res,
        column: columnIndex
      });
    }
    
    return result;
  }, [reservations]);
  
  const maxColumns = useMemo(() => {
    if (processedReservations.length === 0) return 1;
    return Math.max(...processedReservations.map(r => r.column)) + 1;
  }, [processedReservations]);

  // Function to check which reservations are visible in the current scroll view
  const updateHiddenReservations = () => {
    if (!containerRef.current || processedReservations.length === 0) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = containerRef.current.clientHeight;
    
    // Check how many reservations are hidden above or below the viewport
    let above = 0;
    let below = 0;

    processedReservations.forEach(slot => {
      const { top, height } = getReservationStyle(slot.reservation);
      
      const topPixels = (parseFloat(top) / 100) * 1440; // Convert percentage to pixels
      const heightPixels = (parseFloat(height) / 100) * 1440;
      
      // Check if reservation is above the viewport
      if (topPixels + heightPixels < scrollTop - 20) {
        above++;
      }
      // Check if reservation is below the viewport
      else if (topPixels > scrollTop + viewportHeight - 30) {
        below++;
      }
    });
    
    setHiddenAbove(above);
    setHiddenBelow(below);
  };
  
  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      updateHiddenReservations();
    };
    
    container.addEventListener('scroll', handleScroll);
    // Initialize on mount
    updateHiddenReservations();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [processedReservations]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate position and height for a reservation blob
  const getReservationStyle = (reservation: Reservation) => {
    const startTime = new Date(reservation.start_time_iso8601);
    const endTime = new Date(reservation.end_time_iso8601);
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0); // 12 AM
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(24, 0, 0, 0); // 12 AM next day
    
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
    
    const startMinutes = Math.max(0, (startTime.getTime() - dayStart.getTime()) / (1000 * 60));
    const endMinutes = Math.min(totalMinutes, (endTime.getTime() - dayStart.getTime()) / (1000 * 60));
    
    const top = (startMinutes / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
    
    return {
      top: `${top}%`,
      height: `${height}%`
    };
  };

  return (
    <div className="w-full border rounded-lg shadow-sm bg-white">
      <div className="p-4 bg-gray-50 border-b rounded-t-lg">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{formatDate(selectedDate)}</p>
      </div>
      
      <div 
        ref={containerRef} 
        className="relative h-[600px] overflow-y-auto bg-white p-6"
      > 
        {/* Hidden reservation indicators */}
        {hiddenAbove > 0 && (
          <div className="sticky top-0 z-20 flex justify-center mb-2">
            <div className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full opacity-80 shadow-sm">
              {hiddenAbove} more {hiddenAbove === 1 ? 'reservation' : 'reservations'} above
            </div>
          </div>
        )}
        
        {/* Container with padding for spacing around time content */}
        <div className="relative h-[1440px] pt-4 pb-12">
          {/* Fixed time markers that stay in place during scroll */}
          <div className="absolute left-0 top-0 h-full w-20 z-10 bg-white">
            {timeSlots.map((slot, index) => (
              <div 
                key={index} 
                className="absolute flex items-center justify-end pr-3 h-6"
                style={{ top: `${(index / (timeSlots.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}
              >
                <span className="text-xs text-gray-500">{slot.displayTime}</span>
              </div>
            ))}
          </div>
          
          {/* Scrollable content area */}
          <div className="absolute left-20 right-0 top-0 h-full">
            {/* Hour lines */}
            {timeSlots.map((slot, index) => (
              <div 
                key={index} 
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${(index / (timeSlots.length - 1)) * 100}%` }}
              />
            ))}
            
            {/* Reservation column container with padding */}
            <div className="absolute top-0 left-4 right-8 h-full flex">
              {reservations.length === 0 ? (
                <div className="flex items-center justify-center w-full h-full text-gray-500">
                  
                </div>
              ) : (
                // Create columns based on the maximum number of overlapping reservations
                Array.from({ length: maxColumns }).map((_, colIndex) => (
                  <div key={colIndex} className="relative flex-1 mx-1">
                    {/* Display reservations in this column */}
                    {processedReservations
                      .filter(r => r.column === colIndex)
                      .map((slot) => {
                        const positionStyle = getReservationStyle(slot.reservation);
                        return (
                          <ReservationBlob 
                            key={slot.reservation.id}
                            reservation={slot.reservation}
                            style={positionStyle}
                          />
                        );
                      })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom indicator */}
        {hiddenBelow > 0 && (
          <div className="sticky bottom-0 z-20 flex justify-center mt-2">
            <div className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full opacity-80 shadow-sm">
              {hiddenBelow} more {hiddenBelow === 1 ? 'reservation' : 'reservations'} below
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker; 