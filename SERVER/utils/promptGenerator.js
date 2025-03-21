/**
 * Utility functions for generating prompts for PostgreSQL validator functions
 */

/**
 * Generates a prompt for creating a PostgreSQL validator function based on a description
 * 
 * @param {string} description - The human-readable description of the validator logic
 * @param {Object} context - The context object containing database schemas and examples
 * @returns {string} - The generated prompt for the LLM
 */
const generateValidatorPrompt = (description, context = {}) => {
  // Default context if none provided
  const schemas = context.schemas || '';
  const examples = context.examples || '';
  
  return `
As an expert PostgreSQL developer, generate the function body for a validator function with the following specification:

FUNCTION DESCRIPTION:
${description}

FUNCTION SIGNATURE:
CREATE OR REPLACE FUNCTION validate_room_capacity(
    reservation JSONB,
    reservable_constraints JSONB,
    input_constraints JSONB
) RETURNS BOOLEAN AS $$
<YOUR CODE HERE>
$$ LANGUAGE plpgsql;

DATABASE SCHEMAS:
${schemas}

EXAMPLE RESERVATION JSONB:
{
  'reservable_id': 'reservable_id',
  'user_id': 'user_id',
  'start_time': '2024-03-20 14:00:00+00',
  'end_time': '2024-03-20 16:00:00+00',
  'notes': 'notes'
}

EXAMPLE RESERVABLE CONSTRAINTS JSONB:
{
  'constraint1': 'value',
  'constraint2': 'value2'
}

EXAMPLE INPUT CONSTRAINTS JSONB:
{
  'constraint1': 'value3',
  'constraint2': 'value4'
}

The RESERVABLE constraints and the INPUT constraints key names are the same.
The reservable constraints are the constraints that are set by the reservable owner.
The input constraints are the constraints that are set by the user who is making the reservation.

FUNCTION REQUIREMENTS:
1. Use DECLARE section for any variables needed
2. Access JSON values using the PostgreSQL JSON operators (->>, ->, etc.)
3. Return TRUE if the validation passes, FALSE otherwise
4. Handle cases where constraints might be missing
5. Include helpful comments explaining the logic
6. Use proper PostgreSQL data typing and error handling
7. Ensure the function is efficient and handles edge cases
8. Prefix all declared variable names with a v_ prefix

EXAMPLE VALIDATOR FUNCTIONS:
${examples}

Return ONLY the function body (the part that goes between $$ and $$). Do NOT include the CREATE FUNCTION statement or the $$ $$ delimiters.
`;
};

/**
 * Generate a prompt specifically for room capacity validation
 * 
 * @param {string} description - The human-readable description of the capacity validation
 * @returns {string} - The generated prompt for the LLM
 */
const generateCapacityValidatorPrompt = (description) => {
  return generateValidatorPrompt(description, {
    examples: `
-- Example: Check if the number of attendees exceeds the room capacity
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
`
  });
};

/**
 * Generate a prompt for time-based validation
 * 
 * @param {string} description - The human-readable description of the time-based validation
 * @returns {string} - The generated prompt for the LLM
 */
const generateTimeValidatorPrompt = (description) => {
  return generateValidatorPrompt(description, {
    examples: `
-- Example: Check if reservation is during business hours (9 AM to 5 PM)
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    start_hour INTEGER;
    end_hour INTEGER;
BEGIN
    -- Get the reservation times
    start_time := (reservation->>'start_time')::TIMESTAMP;
    end_time := (reservation->>'end_time')::TIMESTAMP;
    
    -- Extract hours
    start_hour := EXTRACT(HOUR FROM start_time);
    end_hour := EXTRACT(HOUR FROM end_time);
    
    -- Validate against business hours
    IF start_hour >= 9 AND end_hour <= 17 THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
`
  });
};

/**
 * Generate a context-aware prompt based on the description content
 * 
 * @param {string} description - The human-readable description of the validator logic
 * @param {Object} databaseContext - The database context with schemas and examples
 * @returns {string} - The most appropriate prompt for the description
 */
const generateSmartPrompt = (description, databaseContext = {}) => {
  const lowerDesc = description.toLowerCase();
  
  // Route to specialized prompt generators based on content
  if (lowerDesc.includes('capacity') || lowerDesc.includes('attendees') || lowerDesc.includes('people')) {
    return generateCapacityValidatorPrompt(description);
  } else if (lowerDesc.includes('time') || lowerDesc.includes('hour') || lowerDesc.includes('duration')) {
    return generateTimeValidatorPrompt(description);
  } else {
    // Fall back to the general prompt
    return generateValidatorPrompt(description, databaseContext);
  }
};

module.exports = {
  generateValidatorPrompt,
  generateCapacityValidatorPrompt,
  generateTimeValidatorPrompt,
  generateSmartPrompt
}; 