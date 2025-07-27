interface BookingFormData {
  name: string;
  email: string;
  description: string;
  category: string;
  subject: string;
  type: 'technical' | 'billing' | 'general' | 'complaint' | 'feature_request';
}


interface BookingFormData {
  name: string;
  email: string;
  description: string;
  category: string;
  subject: string;
  type: "technical" | "billing" | "general" | "complaint" | "feature_request";
}

interface SupportSession {
  sessionId: string;
  id?: string;
  subject: string;
  description: string;
  status: "pending" | "active" | "completed" | "cancelled";
  supporterId?: string;
  userId: User;
  customerId: User;
  agentId: User;
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
