export interface Reservation {
    id: string;
    reservable_id: string;
    user_id: string;
    start_time_standard: string;
    end_time_standard: string;
    start_time_iso8601: string;
    end_time_iso8601: string;
    status?: string;
    notes?: string | null;
    constraint_inputs?: Record<string, string>;
    created_at: string;
    updated_at: string;
  }