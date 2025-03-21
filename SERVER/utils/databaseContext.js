/**
 * Utility to provide database schema context for prompt generation
 */

// Database schema definitions
const SCHEMA_DEFINITIONS = `
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservable_collections (
    parent_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, child_id),
    CHECK (parent_id != child_id)
);

CREATE TABLE constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type constraint_type NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    validation_function regproc NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time_standard TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time_standard TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time_iso8601 VARCHAR(50) NOT NULL,
    end_time_iso8601 VARCHAR(50) NOT NULL,
    status reservation_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time_standard > start_time_standard)
);
`;

// Example validator functions
const EXAMPLE_VALIDATOR_FUNCTIONS = `
-- Example: Check if the number of attendees exceeds the room capacity
CREATE OR REPLACE FUNCTION validate_room_capacity(
    reservation JSONB,
    reservable_constraints JSONB,
    input_constraints JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    max_capacity INTEGER;
    attendees INTEGER;
BEGIN
    -- Get the max capacity from the reservable constraints
    max_capacity := (reservable_constraints->>'capacity')::INTEGER;
    
    -- Get the attendees from the input constraints
    IF input_constraints ? 'capacity' THEN
        attendees := (input_constraints->>'capacity')::INTEGER;
    ELSE
        -- No attendees specified, validation passes
        RETURN TRUE;
    END IF;
    
    -- Validate attendees against max capacity
    RETURN attendees <= max_capacity;
END;
$$ LANGUAGE plpgsql;

-- Example: Check if reservation is during business hours
CREATE OR REPLACE FUNCTION validate_business_hours(
    reservation JSONB,
    reservable_constraints JSONB, 
    input_constraints JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    start_hour INTEGER;
    end_hour INTEGER;
BEGIN
    -- Get the reservation start and end times
    start_time := (reservation->>'start_time')::TIMESTAMP;
    end_time := (reservation->>'end_time')::TIMESTAMP;
    
    -- Extract the hours
    start_hour := EXTRACT(HOUR FROM start_time);
    end_hour := EXTRACT(HOUR FROM end_time);
    
    -- Check if the reservation is within business hours (9 AM to 5 PM)
    RETURN start_hour >= 9 AND end_hour <= 17;
END;
$$ LANGUAGE plpgsql;

-- Example: Check if reservation is on a weekday
CREATE OR REPLACE FUNCTION validate_weekday(
    reservation JSONB,
    reservable_constraints JSONB, 
    input_constraints JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    reservation_date DATE;
    day_of_week INTEGER;
BEGIN
    -- Get the reservation date
    reservation_date := (reservation->>'start_time')::TIMESTAMP::DATE;
    
    -- Extract the day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    day_of_week := EXTRACT(DOW FROM reservation_date);
    
    -- Check if the day is a weekday (Monday to Friday)
    RETURN day_of_week BETWEEN 1 AND 5;
END;
$$ LANGUAGE plpgsql;
`;

/**
 * Get the full database context for prompt generation
 * 
 * @param {Object} options - Options for customizing the context
 * @returns {Object} - The database context object
 */
const getReservableContext = (options = {}) => {
  return {
    schemas: options.includeSchemas !== false ? SCHEMA_DEFINITIONS : '',
    examples: options.includeExamples !== false ? EXAMPLE_VALIDATOR_FUNCTIONS : ''
  };
};

module.exports = {
  getReservableContext,
  SCHEMA_DEFINITIONS,
  EXAMPLE_VALIDATOR_FUNCTIONS
}; 