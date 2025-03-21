const axios = require('axios');
const { Configuration, OpenAI } = require('openai');
require('dotenv').config();

/**
 * Base class for language model interactions
 */
class LanguageModelService {
  constructor() {
    if (this.constructor === LanguageModelService) {
      throw new Error('LanguageModelService is an abstract class and cannot be instantiated directly');
    }
  }

  async generateText(prompt, options = {}) {
    throw new Error('Method "generateText" must be implemented by derived classes');
  }
}

/**
 * OpenAI API implementation using the current OpenAI Node.js SDK
 */
class OpenAIService extends LanguageModelService {
  constructor(config = {}) {
    super();
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
        apiKey: apiKey,
    });
    this.defaultModel = config.model || 'gpt-4';
    this.defaultTemperature = config.temperature || 0.2;
    this.defaultMaxTokens = config.maxTokens || 1000;
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: [
          { role: 'system', content: options.systemMessage || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || this.defaultTemperature,
        max_tokens: options.maxTokens || this.defaultMaxTokens
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
}

/**
 * OpenAI API implementation using direct axios requests (for newer API versions)
 */
class OpenAIAxiosService extends LanguageModelService {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.defaultModel = config.model || 'gpt-4';
    this.defaultTemperature = config.temperature || 0.2;
    this.defaultMaxTokens = config.maxTokens || 1000;
    this.apiBaseUrl = config.apiBaseUrl || 'https://api.openai.com/v1';
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/chat/completions`,
        {
          model: options.model || this.defaultModel,
          messages: [
            { role: 'system', content: options.systemMessage || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || this.defaultTemperature,
          max_tokens: options.maxTokens || this.defaultMaxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
}

/**
 * Azure OpenAI implementation for enterprise deployments
 */
class AzureOpenAIService extends LanguageModelService {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    this.deploymentName = config.deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
    if (!this.apiKey || !this.endpoint || !this.deploymentName) {
      throw new Error('Azure OpenAI requires API key, endpoint, and deployment name');
    }
    
    this.defaultTemperature = config.temperature || 0.2;
    this.defaultMaxTokens = config.maxTokens || 1000;
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`,
        {
          messages: [
            { role: 'system', content: options.systemMessage || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || this.defaultTemperature,
          max_tokens: options.maxTokens || this.defaultMaxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error calling Azure OpenAI API:', error.response?.data || error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
}

/**
 * Factory function to create the appropriate language model service
 */

// TODO: Replace with dependency injection
// TODO: Add support for Anthropic and other LLMs
// TODO: Add suport for AWS Bedrock
// TODO: Add fallback in order of preference
const createLanguageModelService = (serviceType = 'openai', config = {}) => {
  switch (serviceType.toLowerCase()) {
    case 'openai':
      return new OpenAIService(config);
    case 'openai-axios':
      return new OpenAIAxiosService(config);
    case 'azure':
      return new AzureOpenAIService(config);
    default:
      throw new Error(`Unsupported language model service type: ${serviceType}`);
  }
};

module.exports = {
  LanguageModelService,
  OpenAIService,
  OpenAIAxiosService,
  AzureOpenAIService,
  createLanguageModelService
}; 