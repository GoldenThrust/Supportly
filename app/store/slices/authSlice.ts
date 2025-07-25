import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios, { type AxiosResponse } from "axios";
import toast from "react-hot-toast";
export interface User {
  id: string;
  fullname: string;
  email: string;
  image?: string;
  role?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post("/auth/login", credentials);

      if (response.status !== 200) {
        toast.error(response.data.message || "Login failed", {
          duration: 3000,
        });
        return rejectWithValue(response.data.message || "Login failed");
      }

      return response.data;
    } catch (error: any) {
      toast.error(error.response.data.message || "Login failed", {
        duration: 3000,
      });
      return rejectWithValue("Network error");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData: SignupFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/register", userData);

      if (response.status !== 200) {
        toast.error(response.data.message || "Registration failed", {
          duration: 3000,
        });
        return rejectWithValue(response.data.message || "Registration failed");
      }

      return response.data;
    } catch (error: any) {
      toast.error(error.response.data.message || "Registration failed", {
        duration: 3000,
      });
      return rejectWithValue("Network error");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/auth/logout");

      if (response.status !== 200) {
        toast.error(response.data.message || "Logout failed", {
          duration: 3000,
        });
        return rejectWithValue("Logout failed");
      }

      return true;
    } catch (error:any) {
        toast.error(error.response.data.message || "Logout failed", {
          duration: 3000,
        });
      return rejectWithValue("Network error");
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/auth/verify-email/${token}`);

      if (response.status !== 200) {
        toast.error(response.data.message || "Email verification failed", {
          duration: 3000,
        });
        return rejectWithValue(
          response.data.message || "Email verification failed"
        );
      }

      return response.data;
    } catch (error: any) {
      toast.error(error.response.data.message || "Email verification failed", {
        duration: 3000,
      });
      return rejectWithValue("Network error");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Email verification cases
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } =
  authSlice.actions;
export default authSlice.reducer;
