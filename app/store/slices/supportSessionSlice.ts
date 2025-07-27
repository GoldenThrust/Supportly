import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

interface BookingFormData {
  name: string;
  email: string;
  description: string;
  category: string;
  subject: string;
  type: 'technical' | 'billing' | 'general' | 'complaint' | 'feature_request';
}

export interface SupportSession {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "cancelled";
  supporterId?: string;
  userId: string;
  scheduledAt: string;
  createdAt: string;
  meetingLink?: string;
}

interface SupportSessionState {
  sessions: SupportSession[];
  currentSession: SupportSession | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalSessions: number;
  limit: number;
}

const initialState: SupportSessionState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalSessions: 0,
  limit: 10,
};

// Async thunks for API calls
export const fetchSessions = createAsyncThunk(
  "supportSession/fetchSessions",
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await axios.get(`/sessions/all?page=${page}&limit=${limit}`, {
        withCredentials: true,
      });

      return {
        sessions: response.data.sessions,
        currentPage: page,
        limit,
        totalSessions: response.data.total || response.data.sessions.length,
        totalPages: Math.ceil((response.data.total || response.data.sessions.length) / limit)
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch sessions";
      return rejectWithValue(message);
    }
  }
);

export const createSession = createAsyncThunk(
  "supportSession/createSession",
  async (sessionData: BookingFormData, { rejectWithValue }) => {
    try {
      toast.loading("Creating session...", {
        id: "create-session",
      });
      const response = await axios.post("/sessions", sessionData);

      toast.success("Session created successfully!", {
        id: "create-session",
      });
      return response.data.session;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to create session";
      toast.error(message, {
        id: "create-session",
      });
      return rejectWithValue(message);
    }
  }
);

export const joinSession = createAsyncThunk(
  "supportSession/joinSession",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/sessions/${sessionId}/join`,
        {},
        {
          withCredentials: true,
        }
      );

      return response.data.session;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to join session";
      return rejectWithValue(message);
    }
  }
);

export const updateSessionStatus = createAsyncThunk(
  "supportSession/updateSessionStatus",
  async (
    { sessionId, status }: { sessionId: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `/sessions/${sessionId}/status`,
        { status },
        {
          withCredentials: true,
        }
      );

      return response.data.session;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update session";
      return rejectWithValue(message);
    }
  }
);

export const assignAgent = createAsyncThunk(
  "supportSession/assignAgent",
  async (
    { sessionId, agentId }: { sessionId: string; agentId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(
        `/sessions/${sessionId}/assign`,
        { agentId },
        {
          withCredentials: true,
        }
      );

      return response.data.session;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to assign agent";
      return rejectWithValue(message);
    }
  }
);

export const updateSession = createAsyncThunk(
  "supportSession/updateSession",
  async (
    { sessionId, updates }: { sessionId: string; updates: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/sessions/${sessionId}`,
        updates,
        {
          withCredentials: true,
        }
      );

      return response.data.session;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update session";
      return rejectWithValue(message);
    }
  }
);

const supportSessionSlice = createSlice({
  name: "supportSession",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSession: (state, action: PayloadAction<SupportSession>) => {
      state.currentSession = action.payload;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    updateSessionInList: (state, action: PayloadAction<SupportSession>) => {
      const index = state.sessions.findIndex(
        (session) => session.id === action.payload.id
      );
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
    },
    setPaginationParams: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.currentPage = action.payload.page;
      state.limit = action.payload.limit;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions cases
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.sessions;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalSessions = action.payload.totalSessions;
        state.limit = action.payload.limit;
        state.error = null;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create session cases
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions.push(action.payload);
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Join session cases
      .addCase(joinSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      // Update session status cases
      .addCase(updateSessionStatus.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (session) => session.id === action.payload.id
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      // Assign agent cases
      .addCase(assignAgent.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (session) => session.id === action.payload.id
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      // Update session cases
      .addCase(updateSession.fulfilled, (state, action) => {
        const index = state.sessions.findIndex(
          (session) => session.id === action.payload.id
        );
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession?.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      });
  },
});

export const {
  clearError,
  setCurrentSession,
  clearCurrentSession,
  updateSessionInList,
  setPaginationParams,
} = supportSessionSlice.actions;

export default supportSessionSlice.reducer;
