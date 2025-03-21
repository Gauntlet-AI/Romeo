/**
 * Romeo API Playground
 * JavaScript for API interactions
 */

// Global variables
const API = {
    token: localStorage.getItem('jwtToken'),
    user: JSON.parse(localStorage.getItem('userData') || '{}'),
    customToken: localStorage.getItem('customToken') || '',
    useCustomToken: localStorage.getItem('useCustomToken') === 'true',
    baseUrl: window.location.protocol + '//' + window.location.host
};

// Authentication functions
const Auth = {
    /**
     * Check if user is authenticated
     * @returns {Boolean} True if authenticated
     */
    isAuthenticated: function() {
        return !!this.getActiveToken();
    },

    /**
     * Get the active token based on user preference
     * @returns {String} Active JWT token
     */
    getActiveToken: function() {
        if (API.useCustomToken && API.customToken) {
            return API.customToken;
        }
        return API.token;
    },

    /**
     * Update authentication status in UI
     */
    updateStatus: function() {
        const authStatus = document.getElementById('auth-status');
        const tokenContainer = document.getElementById('token-container');
        const tokenDisplay = document.getElementById('token-display');
        const customTokenInput = document.getElementById('custom-token');
        const useCustomTokenCheckbox = document.getElementById('use-custom-token');

        // Update custom token UI
        customTokenInput.value = API.customToken;
        useCustomTokenCheckbox.checked = API.useCustomToken;
        
        if (this.isAuthenticated()) {
            const tokenSource = API.useCustomToken && API.customToken ? 'custom token' : 'registered user token';
            const userName = API.useCustomToken && API.customToken ? 'Custom Token User' : (API.user.name || 'User');
            
            authStatus.innerHTML = `Authenticated with <strong>${tokenSource}</strong> as <strong>${userName}</strong>`;
            tokenContainer.style.display = API.token ? 'block' : 'none';
            tokenDisplay.textContent = API.token || '';
        } else {
            authStatus.textContent = 'Not authenticated';
            tokenContainer.style.display = 'none';
        }
    },

    /**
     * Register a new user
     * @param {Object} userData User data (email, name)
     * @returns {Promise} Promise with result
     */
    register: async function(userData) {
        try {
            const response = await fetch(`${API.baseUrl}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data
                API.token = data.data.token;
                API.user = data.data.user;
                localStorage.setItem('jwtToken', API.token);
                localStorage.setItem('userData', JSON.stringify(API.user));
                
                // Update authentication status
                this.updateStatus();
            }
            
            return {
                success: response.ok,
                data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Apply a custom token
     * @param {String} token JWT token
     */
    applyCustomToken: function(token) {
        API.customToken = token;
        localStorage.setItem('customToken', token);
        this.updateStatus();
        
        return {
            success: true,
            message: 'Custom token applied successfully'
        };
    },

    /**
     * Toggle between custom token and user token
     * @param {Boolean} useCustom Whether to use the custom token
     */
    toggleCustomToken: function(useCustom) {
        API.useCustomToken = useCustom;
        localStorage.setItem('useCustomToken', useCustom);
        this.updateStatus();
    },

    /**
     * Get user profile
     * @returns {Promise} Promise with result
     */
    getProfile: async function() {
        if (!this.isAuthenticated()) {
            return {
                success: false,
                error: 'Not authenticated'
            };
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/users/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            // If token is invalid and not using custom token, clear it
            if (response.status === 401 && !API.useCustomToken) {
                this.logout();
            }
            
            return {
                success: response.ok,
                data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Logout user
     */
    logout: function() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userData');
        API.token = null;
        API.user = {};
        this.updateStatus();
    }
};

// User API functions
const UserAPI = {
    /**
     * Register a new user
     * @param {Object} formData Form data with email and name
     * @returns {Promise} Promise with result
     */
    register: async function(formData) {
        const resultElement = document.getElementById('register-result');
        resultElement.style.display = 'none';
        
        const result = await Auth.register({
            email: formData.email,
            name: formData.name
        });
        
        resultElement.style.display = 'block';
        
        if (result.success) {
            resultElement.innerHTML = `
                <div class="success-message">User created successfully!</div>
                <pre><code>${JSON.stringify(result.data, null, 2)}</code></pre>
            `;
        } else {
            resultElement.innerHTML = `
                <div class="error-message">Error: ${result.data?.message || result.error || 'Registration failed'}</div>
                <pre><code>${JSON.stringify(result.data || {}, null, 2)}</code></pre>
            `;
        }
    },

    /**
     * Get user profile
     */
    getProfile: async function() {
        const resultElement = document.getElementById('profile-result');
        resultElement.style.display = 'none';
        
        const result = await Auth.getProfile();
        
        resultElement.style.display = 'block';
        
        if (result.success) {
            resultElement.innerHTML = `
                <div class="success-message">Profile retrieved successfully!</div>
                <pre><code>${JSON.stringify(result.data, null, 2)}</code></pre>
            `;
        } else {
            if (result.error === 'Not authenticated') {
                resultElement.innerHTML = `
                    <div class="error-message">Error: Not authenticated. Please register first or set a custom token.</div>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${result.data?.message || result.error || 'Failed to get profile'}</div>
                    <pre><code>${JSON.stringify(result.data || {}, null, 2)}</code></pre>
                `;
            }
        }
    }
};

// Reservable API functions
const ReservableAPI = {
    /**
     * Create a new reservable
     * @param {Object} formData Form data with name and description
     * @returns {Promise} Promise with result
     */
    createReservable: async function(formData) {
        const resultElement = document.getElementById('create-reservable-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description
                })
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable created successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to create reservable'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all reservables for authenticated user
     */
    getUserReservables: async function() {
        const resultElement = document.getElementById('user-reservables-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.reservables.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No reservables found. Create one first!</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.reservables.length} reservables successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get reservables'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get a single reservable by ID
     * @param {String} id Reservable ID
     */
    getReservable: async function(id) {
        const resultElement = document.getElementById('get-reservable-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable retrieved successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get reservable'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Update a reservable
     * @param {Object} formData Form data with id, name, and description
     */
    updateReservable: async function(formData) {
        const resultElement = document.getElementById('update-reservable-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const updateData = {};
            if (formData.name) updateData.name = formData.name;
            if (formData.description) updateData.description = formData.description;
            
            const response = await fetch(`${API.baseUrl}/api/reservables/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable updated successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to update reservable'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Delete a reservable
     * @param {String} id Reservable ID
     */
    deleteReservable: async function(id) {
        const resultElement = document.getElementById('delete-reservable-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable deleted successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to delete reservable'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Add a reservable to a collection
     * @param {Object} formData Form data with parent_id and child_id
     */
    addToCollection: async function(formData) {
        const resultElement = document.getElementById('add-to-collection-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/collection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify({
                    parent_id: formData.parent_id,
                    child_id: formData.child_id
                })
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable added to collection successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to add to collection'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Remove a reservable from a collection
     * @param {Object} formData Form data with parent_id and child_id
     */
    removeFromCollection: async function(formData) {
        const resultElement = document.getElementById('remove-from-collection-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/collection/${formData.parent_id}/${formData.child_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservable removed from collection successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to remove from collection'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all children of a reservable
     * @param {String} id Parent reservable ID
     */
    getChildren: async function(id) {
        const resultElement = document.getElementById('get-children-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservables/${id}/children`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.children.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No children found for this reservable.</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.children.length} children successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get children'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    }
};

// Constraint API functions
const ConstraintAPI = {
    /**
     * Create a new constraint
     * @param {Object} formData Form data with reservable_id, name, type, and value
     * @returns {Promise} Promise with result
     */
    createConstraint: async function(formData) {
        const resultElement = document.getElementById('create-constraint-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            // Parse JSON value
            let parsedValue;
            try {
                parsedValue = JSON.parse(formData.value);
            } catch (e) {
                resultElement.style.display = 'block';
                resultElement.innerHTML = `
                    <div class="error-message">Error: Invalid JSON format for the value field.</div>
                `;
                return;
            }
            
            const response = await fetch(`${API.baseUrl}/api/constraints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify({
                    reservable_id: formData.reservable_id,
                    name: formData.name,
                    type: formData.type,
                    value: parsedValue
                })
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Constraint created successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to create constraint'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all constraints for a reservable
     * @param {String} reservableId Reservable ID
     */
    getReservableConstraints: async function(reservableId) {
        const resultElement = document.getElementById('reservable-constraints-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/constraints/reservable/${reservableId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.constraints.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No constraints found for this reservable.</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.constraints.length} constraints successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get constraints'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get a single constraint by ID
     * @param {String} id Constraint ID
     */
    getConstraint: async function(id) {
        const resultElement = document.getElementById('get-constraint-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/constraints/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Constraint retrieved successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get constraint'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Update a constraint
     * @param {Object} formData Form data with id, name, type, and value
     */
    updateConstraint: async function(formData) {
        const resultElement = document.getElementById('update-constraint-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const updateData = {};
            if (formData.name) updateData.name = formData.name;
            if (formData.type) updateData.type = formData.type;
            
            // Parse JSON value if provided
            if (formData.value) {
                try {
                    updateData.value = JSON.parse(formData.value);
                } catch (e) {
                    resultElement.style.display = 'block';
                    resultElement.innerHTML = `
                        <div class="error-message">Error: Invalid JSON format for the value field.</div>
                    `;
                    return;
                }
            }
            
            const response = await fetch(`${API.baseUrl}/api/constraints/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify(updateData)
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Constraint updated successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to update constraint'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Delete a constraint
     * @param {String} id Constraint ID
     */
    deleteConstraint: async function(id) {
        const resultElement = document.getElementById('delete-constraint-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/constraints/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Constraint deleted successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to delete constraint'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    }
};

// Validator API functions
const ValidatorAPI = {
    /**
     * Create a new validator
     * @param {Object} formData Form data with reservable_id and description
     * @returns {Promise} Promise with result
     */
    createValidator: async function(formData) {
        const resultElement = document.getElementById('create-validator-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="info-message">Creating validator, please wait... This may take a few moments as we generate the validation function.</div>
            `;
            
            const response = await fetch(`${API.baseUrl}/api/validators`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify({
                    reservable_id: formData.reservable_id,
                    description: formData.description
                })
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Validator created successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to create validator'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all validators for a reservable
     * @param {String} reservableId Reservable ID
     */
    getReservableValidators: async function(reservableId) {
        const resultElement = document.getElementById('reservable-validators-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/validators/reservable/${reservableId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.validators.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No validators found for this reservable.</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.validators.length} validators successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get validators'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get a single validator by ID
     * @param {String} id Validator ID
     */
    getValidator: async function(id) {
        const resultElement = document.getElementById('get-validator-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/validators/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Validator retrieved successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get validator'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Toggle validator status (active/inactive)
     * @param {Object} formData Form data with id and is_active
     */
    toggleValidatorStatus: async function(formData) {
        const resultElement = document.getElementById('toggle-validator-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const isActive = formData.is_active === 'true';
            
            const response = await fetch(`${API.baseUrl}/api/validators/${formData.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                },
                body: JSON.stringify({
                    is_active: isActive
                })
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Validator ${isActive ? 'activated' : 'deactivated'} successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to update validator status'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Delete a validator
     * @param {String} id Validator ID
     */
    deleteValidator: async function(id) {
        const resultElement = document.getElementById('delete-validator-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/validators/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Validator deleted successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to delete validator'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    }
};

// Reservation API functions
const ReservationAPI = {
    /**
     * Create a new reservation
     * @param {Object} formData Form data with reservation details
     * @returns {Promise} Promise with result
     */
    createReservation: async function(formData) {
        const resultElement = document.getElementById('create-reservation-result');
        resultElement.style.display = 'none';
        
        try {
            // Format dates correctly to ISO8601
            const startTime = new Date(formData.start_time_iso8601);
            const endTime = new Date(formData.end_time_iso8601);
            
            // Prepare data
            const reservationData = {
                reservable_id: formData.reservable_id,
                user_id: formData.user_id,
                start_time_iso8601: startTime.toISOString(),
                end_time_iso8601: endTime.toISOString(),
                notes: formData.notes || null
            };
            
            // Parse constraint inputs if provided
            if (formData.constraint_inputs) {
                try {
                    reservationData.constraint_inputs = JSON.parse(formData.constraint_inputs);
                } catch (e) {
                    resultElement.style.display = 'block';
                    resultElement.innerHTML = `
                        <div class="error-message">Error: Invalid JSON format for constraint_inputs field.</div>
                    `;
                    return;
                }
            } else {
                reservationData.constraint_inputs = {};
            }
            
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="info-message">Creating reservation, please wait...</div>
            `;
            
            const response = await fetch(`${API.baseUrl}/api/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservation created successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to create reservation'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all reservations for a reservable
     * @param {String} reservableId Reservable ID
     */
    getReservableReservations: async function(reservableId) {
        const resultElement = document.getElementById('reservable-reservations-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservations/reservable/${reservableId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.reservations.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No reservations found for this reservable.</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.reservations.length} reservations successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get reservations'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get all reservations for a user
     * @param {String} userId User ID
     */
    getUserReservations: async function(userId) {
        const resultElement = document.getElementById('user-reservations-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservations/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                if (data.data.reservations.length === 0) {
                    resultElement.innerHTML = `
                        <div class="success-message">No reservations found for this user.</div>
                    `;
                } else {
                    resultElement.innerHTML = `
                        <div class="success-message">Retrieved ${data.data.reservations.length} reservations successfully!</div>
                        <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                    `;
                }
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get reservations'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    },

    /**
     * Get a single reservation by ID
     * @param {String} id Reservation ID
     */
    getReservation: async function(id) {
        const resultElement = document.getElementById('get-reservation-result');
        resultElement.style.display = 'none';
        
        if (!Auth.isAuthenticated()) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: Authentication required. Please register or set a custom token first.</div>
            `;
            return;
        }
        
        try {
            const response = await fetch(`${API.baseUrl}/api/reservations/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${Auth.getActiveToken()}`
                }
            });
            
            const data = await response.json();
            
            resultElement.style.display = 'block';
            
            if (response.ok) {
                resultElement.innerHTML = `
                    <div class="success-message">Reservation retrieved successfully!</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            } else {
                resultElement.innerHTML = `
                    <div class="error-message">Error: ${data.message || 'Failed to get reservation'}</div>
                    <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
                `;
            }
        } catch (error) {
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="error-message">Error: ${error.message}</div>
            `;
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI
    Auth.updateStatus();
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(tabName).classList.add('active');
        });
    });

    // Set base URL in documentation
    document.getElementById('base-url').textContent = API.baseUrl;

    // Register form handler
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            email: document.getElementById('email').value,
            name: document.getElementById('name').value
        };
        UserAPI.register(formData);
    });

    // Get profile button
    document.getElementById('get-profile-btn').addEventListener('click', function() {
        UserAPI.getProfile();
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        Auth.logout();
        // Clear results
        document.getElementById('profile-result').style.display = 'none';
    });
    
    // Custom token handlers
    document.getElementById('apply-token-btn').addEventListener('click', function() {
        const token = document.getElementById('custom-token').value.trim();
        if (token) {
            Auth.applyCustomToken(token);
            // Show success notification
            const resultElement = document.getElementById('profile-result');
            resultElement.style.display = 'block';
            resultElement.innerHTML = `
                <div class="success-message">Custom token applied successfully!</div>
            `;
            setTimeout(() => {
                resultElement.style.display = 'none';
            }, 3000);
        }
    });
    
    // Token toggle
    document.getElementById('use-custom-token').addEventListener('change', function(e) {
        Auth.toggleCustomToken(e.target.checked);
    });

    // Reservable form handlers
    document.getElementById('create-reservable-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('reservable-name').value,
            description: document.getElementById('reservable-description').value
        };
        ReservableAPI.createReservable(formData);
    });

    document.getElementById('get-user-reservables-btn').addEventListener('click', function() {
        ReservableAPI.getUserReservables();
    });

    document.getElementById('get-reservable-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('get-reservable-id').value;
        ReservableAPI.getReservable(id);
    });

    document.getElementById('update-reservable-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            id: document.getElementById('update-reservable-id').value,
            name: document.getElementById('update-reservable-name').value,
            description: document.getElementById('update-reservable-description').value
        };
        ReservableAPI.updateReservable(formData);
    });

    document.getElementById('delete-reservable-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('delete-reservable-id').value;
        ReservableAPI.deleteReservable(id);
    });

    document.getElementById('add-to-collection-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            parent_id: document.getElementById('parent-reservable-id').value,
            child_id: document.getElementById('child-reservable-id').value
        };
        ReservableAPI.addToCollection(formData);
    });

    document.getElementById('remove-from-collection-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            parent_id: document.getElementById('remove-parent-id').value,
            child_id: document.getElementById('remove-child-id').value
        };
        ReservableAPI.removeFromCollection(formData);
    });

    document.getElementById('get-children-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('parent-id-children').value;
        ReservableAPI.getChildren(id);
    });

    // Constraint form handlers
    document.getElementById('create-constraint-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            reservable_id: document.getElementById('constraint-reservable-id').value,
            name: document.getElementById('constraint-name').value,
            type: document.getElementById('constraint-type').value,
            value: document.getElementById('constraint-value').value
        };
        ConstraintAPI.createConstraint(formData);
    });

    document.getElementById('get-reservable-constraints-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const reservableId = document.getElementById('get-constraints-reservable-id').value;
        ConstraintAPI.getReservableConstraints(reservableId);
    });

    document.getElementById('get-constraint-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('get-constraint-id').value;
        ConstraintAPI.getConstraint(id);
    });

    document.getElementById('update-constraint-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            id: document.getElementById('update-constraint-id').value,
            name: document.getElementById('update-constraint-name').value,
            type: document.getElementById('update-constraint-type').value,
            value: document.getElementById('update-constraint-value').value
        };
        ConstraintAPI.updateConstraint(formData);
    });

    document.getElementById('delete-constraint-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('delete-constraint-id').value;
        ConstraintAPI.deleteConstraint(id);
    });

    // Validator form handlers
    document.getElementById('create-validator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            reservable_id: document.getElementById('validator-reservable-id').value,
            description: document.getElementById('validator-description').value
        };
        ValidatorAPI.createValidator(formData);
    });

    document.getElementById('get-reservable-validators-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const reservableId = document.getElementById('get-validators-reservable-id').value;
        ValidatorAPI.getReservableValidators(reservableId);
    });

    document.getElementById('get-validator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('get-validator-id').value;
        ValidatorAPI.getValidator(id);
    });

    document.getElementById('toggle-validator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            id: document.getElementById('toggle-validator-id').value,
            is_active: document.getElementById('toggle-validator-status').value
        };
        ValidatorAPI.toggleValidatorStatus(formData);
    });

    document.getElementById('delete-validator-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('delete-validator-id').value;
        ValidatorAPI.deleteValidator(id);
    });

    // Reservation form handlers
    document.getElementById('create-reservation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            reservable_id: document.getElementById('reservation-reservable-id').value,
            user_id: document.getElementById('reservation-user-id').value,
            start_time_iso8601: document.getElementById('reservation-start-time').value,
            end_time_iso8601: document.getElementById('reservation-end-time').value,
            notes: document.getElementById('reservation-notes').value,
            constraint_inputs: document.getElementById('reservation-constraint-inputs').value
        };
        ReservationAPI.createReservation(formData);
    });

    document.getElementById('get-reservable-reservations-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const reservableId = document.getElementById('get-reservations-reservable-id').value;
        ReservationAPI.getReservableReservations(reservableId);
    });

    document.getElementById('get-user-reservations-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const userId = document.getElementById('get-reservations-user-id').value;
        ReservationAPI.getUserReservations(userId);
    });

    document.getElementById('get-reservation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('get-reservation-id').value;
        ReservationAPI.getReservation(id);
    });
}); 