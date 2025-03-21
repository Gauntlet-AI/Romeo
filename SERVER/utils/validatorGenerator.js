const { v4: uuidv4 } = require('uuid');
const { createLanguageModelService } = require('./languageModelService');
const { generateValidatorPrompt } = require('./promptGenerator');
const { getReservableContext } = require('./databaseContext');
const { sequelize } = require('../config/database');
require('dotenv').config();

/**
 * Generate a PostgreSQL validator function based on a description
 * @param {string} description - Human-readable description of the validator logic
 * @param {string} reservableId - UUID of the reservable
 * @returns {Promise<string>} - Generated PostgreSQL function name
 */
const generateValidatorFunction = async (description, reservableId) => {
  try {
    // Generate a unique validator function name with UUID
    const validatorUuid = uuidv4().replace(/-/g, '');
    const functionName = `validator_${validatorUuid}`;
    
    // Get the context for this reservable (includes constraints)
    const context = await getReservableContext(reservableId);
    
    // Generate a smart prompt based on the description
    const prompt = generateValidatorPrompt(description, context);
    
    // Create the language model service using the configured type
    // This allows for swapping between different LLM providers
    // TODO: Replace with dependency injection
    const modelType = process.env.LLM_SERVICE_TYPE || 'openai';
    const modelService = createLanguageModelService(modelType, {
      // Service-specific configuration can be passed here
      model: process.env.LLM_MODEL || 'gpt-4',
      temperature: 0.2,
      maxTokens: 1000
    });
    
    // Query the language model to generate the function body
    const systemMessage = 'You are an expert PostgreSQL developer specializing in creating validator functions for a reservation system.';
    const functionBody = await modelService.generateText(prompt, { systemMessage });
    
    // The complete SQL statement to create the function using the new signature with three parameters
    const sqlStatement = `
      CREATE OR REPLACE FUNCTION ${functionName}(
        reservation JSONB,
        reservable_constraints JSONB,
        input_constraints JSONB
      ) RETURNS boolean AS $$
      ${functionBody}
      $$ LANGUAGE plpgsql;
    `;
    
    // In a real implementation, you would execute the SQL statement
    await sequelize.query(sqlStatement);
    // console.log(`Generated validator function: ${functionName}`);
    // console.log(sqlStatement);
    
    return functionName;
  } catch (error) {
    console.error('Error generating validator function:', error);
    throw new Error(`Failed to generate validator function: ${error.message}`);
  }
};

module.exports = { 
  generateValidatorFunction,
}; 