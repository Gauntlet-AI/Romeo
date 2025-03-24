import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// Create the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more reducers here as needed
  },
  // Optional: add middleware configuration if needed
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for non-serializable warnings
        ignoredActions: ['auth/verify/fulfilled', 'auth/login/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

// Export RootState and AppDispatch types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 