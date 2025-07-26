import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

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
}

const initialState: SupportSessionState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const fetchSessions = createAsyncThunk(
  "supportSession/fetchSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/sessions", {
        withCredentials: true,
      });

      return response.data.sessions;
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
        state.sessions = action.payload;
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
      });
  },
});

export const {
  clearError,
  setCurrentSession,
  clearCurrentSession,
  updateSessionInList,
} = supportSessionSlice.actions;

export default supportSessionSlice.reducer;
