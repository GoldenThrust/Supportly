# Redux Setup for Supportly

This guide explains how to use Redux Toolkit with React Redux in your Supportly application.

## 🏗️ Structure

```
app/
├── store/
│   ├── index.ts           # Store configuration
│   ├── hooks.ts           # Typed hooks
│   ├── selectors.ts       # Memoized selectors
│   └── slices/
│       ├── authSlice.ts   # Authentication state
│       └── supportSessionSlice.ts # Support sessions state
```

## 🔧 Setup Complete

✅ Redux Toolkit (`@reduxjs/toolkit`) - Already installed
✅ React Redux (`react-redux`) - Already installed  
✅ Store configured with auth and support session slices
✅ Redux Provider added to root component
✅ Typed hooks created for TypeScript support

## 📖 Usage Examples

### 1. Using Authentication State

```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';

function LoginComponent() {
  const dispatch = useAppDispatch();
  const { user, isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await dispatch(loginUser(credentials)).unwrap();
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {isAuthenticated && <p>Welcome, {user?.fullname}!</p>}
    </div>
  );
}
```

### 2. Using Support Session State

```tsx
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSessions, createSession } from '../store/slices/supportSessionSlice';

function SessionsComponent() {
  const dispatch = useAppDispatch();
  const { sessions, isLoading, error } = useAppSelector(state => state.supportSession);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleCreateSession = (sessionData) => {
    dispatch(createSession(sessionData));
  };

  return (
    <div>
      {sessions.map(session => (
        <div key={session.id}>
          <h3>{session.title}</h3>
          <p>Status: {session.status}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Available Actions

### Auth Actions
- `loginUser(credentials)` - Login with email and password
- `registerUser(userData)` - Register new user
- `logoutUser()` - Logout current user  
- `verifyEmail(token)` - Verify email with token
- `clearError()` - Clear auth errors
- `setCredentials(user, token)` - Set user credentials
- `clearCredentials()` - Clear user credentials

### Support Session Actions
- `fetchSessions()` - Get all sessions
- `createSession(sessionData)` - Create new session
- `joinSession(sessionId)` - Join existing session
- `updateSessionStatus(sessionId, status)` - Update session status
- `setCurrentSession(session)` - Set active session
- `clearCurrentSession()` - Clear active session

## 🎯 State Structure

### Auth State
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### Support Session State  
```typescript
interface SupportSessionState {
  sessions: SupportSession[];
  currentSession: SupportSession | null;
  isLoading: boolean;
  error: string | null;
}
```

## 🔧 Integration with Backend

The Redux actions are already configured to work with your backend API endpoints:

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/verify-email/:token`
- **Sessions**: `/api/sessions`, `/api/sessions/:id/join`, `/api/sessions/:id/status`

Make sure your backend routes match these endpoints for seamless integration.

## 📱 Next Steps

1. Update your existing components to use Redux state
2. Replace local state management with Redux actions
3. Add error handling with toast notifications
4. Implement session persistence with Redux Persist (optional)

## 🚀 Example Integration

Your login component has already been updated to use Redux! Check `app/routes/auth/login.tsx` to see how it's implemented.

You can follow the same pattern for other components that need state management.
