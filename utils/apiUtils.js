/**
 * ApiUtils - HTTP API Testing Utility Class
 * 
 * Provides a comprehensive set of methods for making HTTP requests and handling API responses.
 * Supports GET, POST, PUT, DELETE operations with configurable authentication and headers.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * ApiUtils class for handling HTTP API requests
 * 
 * This class provides methods for making HTTP requests with configurable
 * base URL, timeout, headers, and authentication. It supports loading
 * payloads from files and validating responses against expected schemas.
 * 
 * @example
 * const config = {
 *   baseUrl: 'https://api.example.com',
 *   timeout: 5000,
 *   headers: { 'Content-Type': 'application/json' }
 * };
 * const apiUtils = new ApiUtils(config);
 * const response = await apiUtils.get('/users');
 */
class ApiUtils {
    /**
     * Creates a new ApiUtils instance
     * 
     * @param {Object} config - Configuration object for API client
     * @param {string} config.baseUrl - Base URL for API requests
     * @param {number} [config.timeout=5000] - Request timeout in milliseconds
     * @param {Object} [config.headers] - Default headers for requests
     * @param {string} [config.username] - Username for basic authentication
     * @param {string} [config.password] - Password for basic authentication
     * @param {string} [config.apiKey] - API key for authentication
     */
    constructor(config) {
        this.config = config;
        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 5000,
            headers: config.headers || {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Makes a POST request to the specified endpoint
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/users')
     * @param {Object|null} [payload=null] - Request body payload
     * @param {Object} [customHeaders={}] - Additional headers for this request
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails
     * 
     * @example
     * const response = await apiUtils.post('/users', { name: 'John', email: 'john@example.com' });
     */
    async post(endpoint, payload = null, customHeaders = {}) {
        try {
            console.log(`🔹 Sending POST request to: ${endpoint}`);
            
            const headers = {
                ...this.config.headers,
                ...customHeaders
            };

            // Add authentication if provided
            if (this.config.username && this.config.password) {
                const encodedCredentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
                headers.Authorization = `Basic ${encodedCredentials}`;
            }

            const response = payload ?
                await this.client.post(endpoint, payload, { headers }) :
                await this.client.post(endpoint, null, { headers });

            console.log('✅ Response Received:', JSON.stringify(response.data, null, 2));
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('🚨 Error performing POST request:', error.message);
            if (error.response) {
                console.error('🔹 Response details:', JSON.stringify({
                    status: error.response.status,
                    headers: error.response.headers,
                    data: error.response.data
                }, null, 2));
            }
            throw error;
        }
    }

    /**
     * Makes a GET request to the specified endpoint
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/users')
     * @param {Object} [params={}] - Query parameters
     * @param {Object} [customHeaders={}] - Additional headers for this request
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails
     * 
     * @example
     * const response = await apiUtils.get('/users', { page: 1, limit: 10 });
     */
    async get(endpoint, params = {}, customHeaders = {}) {
        try {
            console.log(`🔹 Sending GET request to: ${endpoint}`);
            
            const headers = {
                ...this.config.headers,
                ...customHeaders
            };

            // Add authentication if provided
            if (this.config.username && this.config.password) {
                const encodedCredentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
                headers.Authorization = `Basic ${encodedCredentials}`;
            }

            const response = await this.client.get(endpoint, { 
                params, 
                headers 
            });
            
            console.log('✅ Response Received:', JSON.stringify(response.data, null, 2));
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('🚨 Error performing GET request:', error.message);
            throw error;
        }
    }

    /**
     * Makes a PUT request to the specified endpoint
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/users/1')
     * @param {Object|null} [payload=null] - Request body payload
     * @param {Object} [customHeaders={}] - Additional headers for this request
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails
     * 
     * @example
     * const response = await apiUtils.put('/users/1', { name: 'John Updated' });
     */
    async put(endpoint, payload = null, customHeaders = {}) {
        try {
            console.log(`🔹 Sending PUT request to: ${endpoint}`);
            
            const headers = {
                ...this.config.headers,
                ...customHeaders
            };

            // Add authentication if provided
            if (this.config.username && this.config.password) {
                const encodedCredentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
                headers.Authorization = `Basic ${encodedCredentials}`;
            }

            const response = await this.client.put(endpoint, payload, { headers });
            
            console.log('✅ Response Received:', JSON.stringify(response.data, null, 2));
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('🚨 Error performing PUT request:', error.message);
            throw error;
        }
    }

    /**
     * Makes a DELETE request to the specified endpoint
     * 
     * @param {string} endpoint - API endpoint path (e.g., '/users/1')
     * @param {Object} [params={}] - Query parameters
     * @param {Object} [customHeaders={}] - Additional headers for this request
     * @returns {Promise<Object>} Response data
     * @throws {Error} If request fails
     * 
     * @example
     * const response = await apiUtils.delete('/users/1');
     */
    async delete(endpoint, params = {}, customHeaders = {}) {
        try {
            console.log(`🔹 Sending DELETE request to: ${endpoint}`);
            
            const headers = {
                ...this.config.headers,
                ...customHeaders
            };

            // Add authentication if provided
            if (this.config.username && this.config.password) {
                const encodedCredentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
                headers.Authorization = `Basic ${encodedCredentials}`;
            }

            const response = await this.client.delete(endpoint, { 
                params, 
                headers 
            });
            
            console.log('✅ Response Received:', JSON.stringify(response.data, null, 2));
            return { status: response.status, data: response.data };
        } catch (error) {
            console.error('🚨 Error performing DELETE request:', error.message);
            throw error;
        }
    }

    /**
     * Loads a JSON payload from a file
     * 
     * @param {string} filePath - Path to the JSON file
     * @returns {Object} Parsed JSON data
     * @throws {Error} If file cannot be read or parsed
     * 
     * @example
     * const payload = apiUtils.loadPayloadFromFile('test-data/user-payload.json');
     */
    loadPayloadFromFile(filePath) {
        try {
            const resolvedPath = path.resolve(__dirname, '../', filePath);
            const payload = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
            console.log('🔹 Loaded payload from file:', filePath);
            return payload;
        } catch (error) {
            console.error(`🚨 Error loading payload file: ${filePath}`, error.message);
            throw new Error(`Payload file error: ${error.message}`);
        }
    }

    /**
     * Validates a response against an expected schema
     * 
     * @param {Object} response - API response object
     * @param {Object} expectedSchema - Expected response schema
     * @returns {boolean} True if response matches schema
     * @throws {Error} If validation fails
     * 
     * @example
     * const isValid = apiUtils.validateResponse(response, { id: 'number', name: 'string' });
     */
    validateResponse(response, expectedSchema) {
        // This is a basic validation - you can enhance it based on your needs
        for (const key in expectedSchema) {
            if (!response.data.hasOwnProperty(key)) {
                throw new Error(`Response missing required field: ${key}`);
            }
        }
        return true;
    }
}

module.exports = ApiUtils;
