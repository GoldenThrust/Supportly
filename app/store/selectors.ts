import type { RootState } from '../store';

// Auth selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Support Session selectors
export const selectSupportSessions = (state: RootState) => state.supportSession;
export const selectSessions = (state: RootState) => state.supportSession.sessions;
export const selectCurrentSession = (state: RootState) => state.supportSession.currentSession;
export const selectSessionsLoading = (state: RootState) => state.supportSession.isLoading;
export const selectSessionsError = (state: RootState) => state.supportSession.error;
export const selectCurrentPage = (state: RootState) => state.supportSession.currentPage;
export const selectTotalPages = (state: RootState) => state.supportSession.totalPages;
export const selectTotalSessions = (state: RootState) => state.supportSession.totalSessions;
export const selectSessionsLimit = (state: RootState) => state.supportSession.limit;
