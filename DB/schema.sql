-- Reservation System PostgreSQL Schema
-- A minimalist reservation system with support for reservables, constraints, and validators

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User status enum
CREATE TYPE user_status AS ENUM ('pending', 'approved');

-- Reservation status enum
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected');

-- Constraint type enum
CREATE TYPE constraint_type AS ENUM ('date', 'time', 'integer', 'string', 'boolean', 'email', 'phone');

-- Users table
-- Stores user information, though account creation is optional
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reservables table
-- A reservable can be a single item or a collection of other reservables
CREATE TABLE reservables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reservable Collections table
-- Represents hierarchical relationships between reservables
CREATE TABLE reservable_collections (
    parent_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, child_id),
    -- Prevent a reservable from being its own parent
    CHECK (parent_id != child_id)
);

-- Constraints table
-- Arbitrary fields added to a reservable with associated enum type and value
CREATE TABLE constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type constraint_type NOT NULL, -- Type of constraint
    value TEXT NOT NULL,             -- Value of constraint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a custom type for validator functions
-- This ensures that only functions with the correct signature can be used
CREATE OR REPLACE FUNCTION verify_validator_function(function_name regproc)
RETURNS BOOLEAN AS $$
DECLARE
    func_args oid[];
    ret_type text;
    jsonb_type_oid oid;
BEGIN
    -- Get the OID for the jsonb type
    SELECT oid INTO jsonb_type_oid FROM pg_type WHERE typname = 'jsonb';
    
    -- Get function information
    SELECT p.proargtypes, t.typname 
    INTO func_args, ret_type
    FROM pg_proc p
    JOIN pg_type t ON p.prorettype = t.oid
    WHERE p.oid = function_name::regproc::oid;

    -- Verify that function has arguments and takes exactly one JSONB argument
    IF func_args IS NULL OR 
       array_length(func_args, 1) != 1 OR 
       func_args[1] != jsonb_type_oid THEN
        RETURN FALSE;
    END IF;

    -- Verify that function returns boolean
    IF ret_type != 'bool' THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Drop the old validators table if it exists
DROP TABLE IF EXISTS validators CASCADE;

-- Create the new validators table with function references
CREATE TABLE validators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    validation_function regproc NOT NULL,  -- Reference to the validation function
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure the function has the correct signature (takes JSONB, returns BOOLEAN)
    CONSTRAINT valid_function_signature CHECK (verify_validator_function(validation_function))
);

-- Reservations table
-- Records of reservations submitted against the reservable
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservable_id UUID NOT NULL REFERENCES reservables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time_standard TIMESTAMP WITH TIME ZONE NOT NULL, -- For easier database querying
    end_time_standard TIMESTAMP WITH TIME ZONE NOT NULL,   -- For easier database querying
    start_time_iso8601 VARCHAR(50) NOT NULL,               -- ISO 8601 format representation
    end_time_iso8601 VARCHAR(50) NOT NULL,                 -- ISO 8601 format representation
    status reservation_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure end time is after start time
    CHECK (end_time_standard > start_time_standard)
);

-- Add indexes for performance optimization
CREATE INDEX idx_reservations_reservable_id ON reservations(reservable_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date_range ON reservations(start_time_standard, end_time_standard);
CREATE INDEX idx_reservables_user_id ON reservables(user_id);
CREATE INDEX idx_constraints_reservable_id ON constraints(reservable_id);
CREATE INDEX idx_validators_reservable_id ON validators(reservable_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservables_updated_at
    BEFORE UPDATE ON reservables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at
    BEFORE UPDATE ON constraints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validators_updated_at
    BEFORE UPDATE ON validators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function to validate constraint type and value
CREATE OR REPLACE FUNCTION validate_constraint_value(
    constraint_type constraint_type,
    constraint_value TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Allow NULL values for all types
    IF constraint_value IS NULL THEN
        RETURN TRUE;
    END IF;

    CASE constraint_type
        WHEN 'date' THEN
            -- Try to cast to date, return false if fails
            BEGIN
                PERFORM constraint_value::DATE;
                RETURN TRUE;
            EXCEPTION WHEN OTHERS THEN
                RETURN FALSE;
            END;
        WHEN 'time' THEN
            -- Try to cast to time, return false if fails
            BEGIN
                PERFORM constraint_value::TIME;
                RETURN TRUE;
            EXCEPTION WHEN OTHERS THEN
                RETURN FALSE;
            END;
        WHEN 'integer' THEN
            -- Check if value is a valid integer
            RETURN constraint_value ~ '^[0-9]+$';
        WHEN 'boolean' THEN
            -- Check if value is a valid boolean
            RETURN constraint_value IN ('true', 'false', '1', '0', 't', 'f');
        WHEN 'email' THEN
            -- Basic email validation using regex
            RETURN constraint_value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
        WHEN 'phone' THEN
            -- Basic phone number validation (allows various formats)
            RETURN constraint_value ~ '^\+?[0-9\s-\(\)\.]{8,}$';
        WHEN 'string' THEN
            -- All text values are valid strings
            RETURN TRUE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate that a constraint name exists for a reservable
CREATE OR REPLACE FUNCTION validate_constraint_name(
    p_reservable_id UUID,
    p_constraint_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if the constraint name exists for this reservable
    SELECT EXISTS(
        SELECT 1 
        FROM constraints 
        WHERE reservable_id = p_reservable_id AND name = p_constraint_name
    ) INTO v_exists;
    
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- Add function to generate a stable lock ID for a time range
CREATE OR REPLACE FUNCTION generate_reservation_lock_id(
    p_reservable_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS bigint AS $$
BEGIN
    -- Generate a stable bigint from UUID and time range
    -- First remove hyphens from UUID, then take first 15 chars of hex
    RETURN (
        ('x' || substr(replace(p_reservable_id::text, '-', ''), 1, 15))::bit(64)::bigint +
        extract(epoch from p_start_time)::bigint * 1000 +
        extract(epoch from p_end_time)::bigint
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Modify the create_reservation procedure
CREATE OR REPLACE PROCEDURE create_reservation(
    p_reservable_id UUID,
    p_user_id UUID,
    p_start_time_standard TIMESTAMP WITH TIME ZONE,
    p_end_time_standard TIMESTAMP WITH TIME ZONE,
    p_start_time_iso8601 VARCHAR(50),
    p_end_time_iso8601 VARCHAR(50),
    p_notes TEXT,
    p_constraint_inputs JSONB,
    OUT p_reservation_id UUID,
    OUT p_status reservation_status,
    OUT p_error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_constraint record;
    v_validator record;
    v_constraint_value text;
    v_constraint_type constraint_type;
    v_validation_result boolean;
    v_validation_data jsonb;
    v_status reservation_status := 'pending';
    v_all_constraints_valid boolean := true;
    v_fail_message text;
    v_invalid_constraints text[];
    v_lock_id bigint;
BEGIN
    -- Initialize output parameters
    p_reservation_id := NULL;
    p_status := NULL;
    p_error_message := NULL;

    -- Basic input validation
    IF p_reservable_id IS NULL THEN
        p_error_message := 'Reservable ID cannot be null';
        RETURN;
    END IF;
    -- Check if reservable exists - ADD THIS CHECK EARLY
    IF NOT EXISTS (SELECT 1 FROM reservables WHERE id = p_reservable_id) THEN
        p_error_message := 'Invalid reservable ID: Reservable does not exist';
        RETURN;
    END IF;
    IF p_user_id IS NULL THEN
        p_error_message := 'User ID cannot be null';
        RETURN;
    END IF;
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
        p_error_message := 'Invalid user ID: User does not exist';
        RETURN;
    END IF;
    IF p_start_time_standard IS NULL OR p_end_time_standard IS NULL THEN
        p_error_message := 'Start and end times cannot be null';
        RETURN;
    END IF;
    IF p_start_time_standard >= p_end_time_standard THEN
        p_error_message := 'End time must be after start time';
        RETURN;
    END IF;
    IF p_start_time_iso8601 IS NULL OR p_end_time_iso8601 IS NULL THEN
        p_error_message := 'ISO 8601 start and end times cannot be null';
        RETURN;
    END IF;

    -- Generate and acquire lock first
    v_lock_id := generate_reservation_lock_id(
        p_reservable_id, 
        p_start_time_standard, 
        p_end_time_standard
    );
    
    -- Try to acquire the advisory lock
    IF NOT pg_try_advisory_xact_lock(v_lock_id) THEN
        p_error_message := 'Could not acquire lock. Another reservation in progress.';
        RETURN;
    END IF;

    -- Check for overlapping reservations
    IF EXISTS (
        SELECT 1 
        FROM reservations 
        WHERE reservable_id = p_reservable_id
        AND status = 'approved'
        AND (
            (start_time_standard, end_time_standard) OVERLAPS 
            (p_start_time_standard, p_end_time_standard)
        )
    ) THEN
        p_error_message := 'Overlapping reservation exists';
        RETURN;
    END IF;

    -- First, validate that all input constraint names exist for this reservable
    SELECT array_agg(key)
    INTO v_invalid_constraints
    FROM jsonb_object_keys(p_constraint_inputs) AS key
    WHERE NOT validate_constraint_name(p_reservable_id, key);

    -- If there are invalid constraint names, return an error
    IF v_invalid_constraints IS NOT NULL AND array_length(v_invalid_constraints, 1) > 0 THEN
        -- Get the list of valid constraint names for the error message
        WITH valid_constraints AS (
            SELECT array_agg(name) as names
            FROM constraints
            WHERE reservable_id = p_reservable_id
        )
        SELECT format('Invalid constraint names provided: %s. Valid constraints are: %s',
                     array_to_string(v_invalid_constraints, ', '),
                     array_to_string((SELECT names FROM valid_constraints), ', '))
        INTO p_error_message;
        RETURN;
    END IF;

    -- Then, validate all constraint inputs against their defined types
    FOR v_constraint IN 
        SELECT c.id, c.name, c.type, c.value
        FROM constraints c
        WHERE c.reservable_id = p_reservable_id
    LOOP
        -- Extract the constraint value from the JSON input
        v_constraint_value := p_constraint_inputs->>v_constraint.name;
        v_constraint_type := v_constraint.type;
        
        -- Check if the constraint value is valid for its type
        IF NOT validate_constraint_value(v_constraint_type, v_constraint_value) THEN
            p_error_message := format('Invalid value for constraint "%s". Expected type: %s, Got: %s',
                                     v_constraint.name, v_constraint_type, v_constraint_value);
            RETURN;
        END IF;
    END LOOP;

    -- Prepare the validation data
    v_validation_data := jsonb_build_object(
        'reservation', jsonb_build_object(
            'user_id', p_user_id,
            'reservable_id', p_reservable_id,
            'start_time', p_start_time_standard,
            'end_time', p_end_time_standard,
            'notes', p_notes
        ),
        'constraints', p_constraint_inputs
    );

    -- Run all validators for this reservable
    FOR v_validator IN 
        SELECT v.id, v.description, v.validation_function
        FROM validators v
        WHERE v.reservable_id = p_reservable_id AND v.is_active = true
    LOOP
        -- Execute the validation function with our data
        BEGIN
            EXECUTE format('SELECT %s($1)', v_validator.validation_function) 
            INTO v_validation_result 
            USING v_validation_data;
            
            -- If validation fails, set status and exit loop
            IF NOT v_validation_result THEN
                v_all_constraints_valid := false;
                v_status := 'rejected';
                v_fail_message := format('Validation failed: %s', v_validator.description);
                EXIT; -- Exit the loop on first failure
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Handle exceptions in validator functions
            v_all_constraints_valid := false;
            v_status := 'rejected';
            v_fail_message := format('Validation error: %s - %s', v_validator.description, SQLERRM);
            EXIT;
        END;
    END LOOP;

    -- If all validations pass, insert the reservation with status 'approved'
    IF v_all_constraints_valid THEN
        v_status := 'approved';
        
        INSERT INTO reservations (
            reservable_id,
            user_id,
            start_time_standard,
            end_time_standard,
            start_time_iso8601,
            end_time_iso8601,
            status,
            notes
        ) VALUES (
            p_reservable_id,
            p_user_id,
            p_start_time_standard,
            p_end_time_standard,
            p_start_time_iso8601,
            p_end_time_iso8601,
            v_status,
            p_notes
        ) RETURNING id INTO p_reservation_id;
        
        p_status := v_status;
    ELSE
        -- Return the error message but don't insert the reservation
        p_error_message := v_fail_message;
        p_status := v_status;
    END IF;
END;
$$;

-- Comments about usage
COMMENT ON SCHEMA public IS 'Minimalist reservation system schema';
COMMENT ON TABLE users IS 'Users who may create reservations (account optional but tracked)';
COMMENT ON TABLE reservables IS 'Items or collections that can be reserved';
COMMENT ON TABLE reservable_collections IS 'Hierarchical relationships between reservables';
COMMENT ON TABLE constraints IS 'Arbitrary fields with type and value attached to reservables';
COMMENT ON TABLE validators IS 'SQL code to validate reservations based on constraints';
COMMENT ON TABLE reservations IS 'Records of reservations made against reservables';
COMMENT ON PROCEDURE create_reservation IS 'Creates a reservation after validating constraint inputs and running validation functions'; 