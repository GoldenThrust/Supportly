import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import supportSessionReducer from './slices/supportSessionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    supportSession: supportSessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store state types for convenience
export type AuthState = RootState['auth'];
export type SupportSessionState = RootState['supportSession'];
