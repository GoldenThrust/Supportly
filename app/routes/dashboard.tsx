import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchSessions,
  assignAgent,
  updateSessionStatus,
  updateSession,
} from "../store/slices/supportSessionSlice";
import {
  selectSessions,
  selectSessionsLoading,
  selectSessionsError,
  selectCurrentPage,
  selectTotalPages,
  selectTotalSessions,
  selectSessionsLimit,
} from "../store/selectors";
import axios from "axios";
import toast from "react-hot-toast";

export function meta() {
  return [
    { title: "Support Dashboard - Supportly" },
    {
      name: "description",
      content: "Manage support sessions and team availability",
    },
  ];
}

interface Session {
  id: string;
  sessionId?: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  reason: string;
  status:
    | "pending"
    | "active"
    | "waiting"
    | "resolved"
    | "closed"
    | "escalated";
  assignedTo?: string;
  customerId?: {
    name: string;
    email: string;
  };
  agentId?: {
    name: string;
    email: string;
  };
  teamId?: {
    name: string;
  };
  subject?: string;
  description?: string;
  category?: string;
  priority?: string;
  scheduledAt?: string;
  createdAt?: string;
}


  interface Teams {
    _id: string;
    name: string;
    email: string;
  }

  interface UpdateFormData {
    agentId: string;
    status: string;
    priority: string;
    notes: string;
  }

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(selectSessions);
  const isLoading = useAppSelector(selectSessionsLoading);
  const error = useAppSelector(selectSessionsError);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const totalSessions = useAppSelector(selectTotalSessions);
  const sessionsLimit = useAppSelector(selectSessionsLimit);

  const [activeTab, setActiveTab] = useState<"sessions" | "schedule" | "team">(
    "sessions"
  );
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<UpdateFormData>({
    defaultValues: {
      agentId: "",
      status: "",
      priority: "medium",
      notes: "",
    }
  });

  const [availableAgents, setavailableAgents] = useState<Teams[]>([]);

  // Mock data for available agents (in real app, this would come from API)
  // const availableAgents = [
  //   { id: 'agent1', name: 'Sarah Johnson', email: 'sarah@company.com' },
  //   { id: 'agent2', name: 'Mike Chen', email: 'mike@company.com' },
  //   { id: 'agent3', name: 'Emily Davis', email: 'emily@company.com' },
  // ];

  // Fetch sessions from backend when component mounts
  useEffect(() => {
    dispatch(fetchSessions({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    axios.get("/users?role=support_agent").then((response) => {
      const data = response.data;
      console.log(data);
      setavailableAgents(data);
    }).catch(() => {
      toast.error('Error fetching teams');
    });
  }, [dispatch]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (activeTab === "sessions" && !isLoading) {
        if (event.key === "ArrowLeft" && currentPage > 1) {
          handlePageChange(currentPage - 1);
        } else if (event.key === "ArrowRight" && currentPage < totalPages) {
          handlePageChange(currentPage + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [activeTab, currentPage, totalPages, isLoading]);

  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(fetchSessions({ page: newPage, limit: sessionsLimit }));
    }
  };

  // Function to handle page size changes
  const handlePageSizeChange = (newLimit: number) => {
    dispatch(fetchSessions({ page: 1, limit: newLimit }));
  };

  // Function to handle refresh
  const handleRefresh = () => {
    dispatch(fetchSessions({ page: currentPage, limit: sessionsLimit }));
  };

  // Function to handle "Go to page" input
  const handleGoToPage = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      const page = parseInt(target.value);
      if (page >= 1 && page <= totalPages) {
        handlePageChange(page);
        target.value = "";
      } else {
        target.value = "";
        // Could add a toast notification here for invalid page
      }
    }
  };

  // Function to open update modal
  const openUpdateModal = (session: Session) => {
    setSelectedSession(session);
    reset({
      agentId: session.agentId?.name || "",
      status: session.status,
      priority: session.priority || "medium",
      notes: "",
    });
    setShowUpdateModal(true);
  };

  // Function to close update modal
  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedSession(null);
    reset({
      agentId: "",
      status: "",
      priority: "",
      notes: "",
    });
  };

  // Function to handle quick status change
  const handleQuickStatusChange = async (
    sessionId: string,
    newStatus: string
  ) => {
    try {
      await dispatch(updateSessionStatus({ sessionId, status: newStatus }));
      // Refresh the current page
      dispatch(fetchSessions({ page: currentPage, limit: sessionsLimit }));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Function to handle agent assignment
  const handleAssignAgent = async (sessionId: string, agentId: string) => {
    try {
      await dispatch(assignAgent({ sessionId, agentId }));
      // Refresh the current page
      dispatch(fetchSessions({ page: currentPage, limit: sessionsLimit }));
    } catch (error) {
      console.error("Error assigning agent:", error);
    }
  };

  // Function to handle form submission
  const handleUpdateSubmit = async (data: UpdateFormData) => {
    if (!selectedSession) return;

    try {
      const updates: any = {};

      if (data.agentId && data.agentId !== selectedSession.assignedTo) {
        const selectedAgent = availableAgents.find(
          (agent) => agent.name === data.agentId
        );
        if (selectedAgent) {
          updates.email = selectedAgent.email;
        }
      }

      if (data.status && data.status !== selectedSession.status) {
        updates.status = data.status;
      }

      if (data.priority && data.priority !== selectedSession.priority) {
        updates.priority = data.priority;
      }

      if (data.notes) {
        updates.notes = data.notes;
      }

      if (Object.keys(updates).length > 0) {
        await dispatch(
          updateSession({ sessionId: selectedSession.id, updates })
        ).unwrap();
        // Refresh the current page
        dispatch(fetchSessions({ page: currentPage, limit: sessionsLimit }));
        toast.success("Session updated successfully!");
      }

      closeUpdateModal();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session. Please try again.");
    }
  };

  // Helper function to format date and time
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { date: "Invalid date", time: "00:00" };
      }
      return {
        date: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch (error) {
      return { date: "Invalid date", time: "00:00" };
    }
  };

  // Transform backend sessions to match frontend interface
  const transformedSessions: Session[] = sessions.map((session: any) => {
    const dateTime = session.scheduledAt || session.date;
    const formatted = formatDateTime(dateTime);

    return {
      id: session.id || session.sessionId || session._id,
      sessionId: session.sessionId,
      customerName:
        session.customerId?.name || session.customerName || "Unknown Customer",
      customerEmail:
        session.customerId?.email ||
        session.customerEmail ||
        "No email provided",
      date: session.scheduledAt
        ? new Date(session.scheduledAt).toISOString().split("T")[0]
        : session.date
        ? new Date(session.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      time: formatted.time,
      reason:
        session.description ||
        session.subject ||
        session.reason ||
        "No description provided",
      status: session.status || "pending",
      assignedTo:
        session.agentId?.name ||
        session.teamId?.name ||
        session.assignedTo ||
        "Unassigned",
      customerId: session.customerId,
      agentId: session.agentId,
      teamId: session.teamId,
      subject: session.subject,
      description: session.description,
      category: session.category,
      priority: session.priority,
      scheduledAt: session.scheduledAt,
      createdAt: session.createdAt,
    };
  });

  // Calculate stats from actual session data
  const todaysSessions = transformedSessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  }).length;

  const completedSessions = transformedSessions.filter(
    (session) => session.status === "resolved" || session.status === "closed"
  ).length;

  const pendingSessions = transformedSessions.filter(
    (session) => session.status === "pending" || session.status === "waiting"
  ).length;

  const activeSessions = transformedSessions.filter(
    (session) => session.status === "active"
  ).length;

  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  });

  const handleAvailabilityChange = (
    day: string,
    field: string,
    value: string | boolean
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value },
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "waiting":
        return "bg-orange-100 text-orange-800";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <h1
                className="text-2xl font-bold text-indigo-600"
                style={{
                  fontFamily:
                    "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
                  fontVariantCaps: "small-caps",
                }}
              >
                Supportly
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Admin Dashboard</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Support Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your support sessions and team availability
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Sessions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? "..." : todaysSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? "..." : completedSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? "..." : pendingSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? "..." : activeSessions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sessions"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Support Sessions
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "schedule"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Schedule Management
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "team"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Team Management
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Support Sessions
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-700">
                      Show:
                    </label>
                    <select
                      id="pageSize"
                      value={sessionsLimit}
                      onChange={(e) =>
                        handlePageSizeChange(parseInt(e.target.value))
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">per page</span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <svg
                    className={`-ml-0.5 mr-2 h-4 w-4 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  Error loading sessions: {error}
                </div>
              )}
            </div>
            <div className="overflow-x-auto relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                </div>
              )}
              {transformedSessions.length === 0 && !isLoading ? (
                <div className="text-center p-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-2">No support sessions found</p>
                  <p className="text-sm">
                    Sessions will appear here when customers book support
                    appointments
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject/Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transformedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {session.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {
                              formatDateTime(
                                session.scheduledAt ||
                                  session.date ||
                                  new Date().toISOString()
                              ).date
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            <div className="font-medium truncate">
                              {session.subject || "No subject"}
                            </div>
                            <div className="text-gray-500 truncate">
                              {session.reason}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                            {session.category || "general"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.assignedTo || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.priority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : session.priority === "high"
                                ? "bg-orange-100 text-orange-800"
                                : session.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {session.priority || "medium"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/video-call/${
                                session.sessionId || session.id
                              }`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Join Call
                            </Link>
                            <button
                              onClick={() => openUpdateModal(session)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            {session.status === "pending" && (
                              <button
                                onClick={() =>
                                  handleQuickStatusChange(session.id, "active")
                                }
                                className="text-green-600 hover:text-green-900"
                              >
                                Activate
                              </button>
                            )}
                            {session.status === "active" && (
                              <button
                                onClick={() =>
                                  handleQuickStatusChange(
                                    session.id,
                                    "resolved"
                                  )
                                }
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && totalSessions > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {Math.min(
                          (currentPage - 1) * sessionsLimit + 1,
                          totalSessions
                        )}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * sessionsLimit, totalSessions)}
                      </span>{" "}
                      of <span className="font-medium">{totalSessions}</span>{" "}
                      results
                      {totalPages > 1 && (
                        <span className="text-gray-500 ml-2">
                          (Use ← → arrow keys to navigate)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          // Show first page, last page, current page, and pages around current page
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 &&
                              page <= currentPage + 1);

                          if (!showPage) {
                            // Show ellipsis for gaps
                            if (
                              (page === currentPage - 2 && currentPage > 3) ||
                              (page === currentPage + 2 &&
                                currentPage < totalPages - 2)
                            ) {
                              return (
                                <span
                                  key={page}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>

                    {/* Quick page navigation */}
                    {totalPages > 5 && (
                      <div className="flex items-center ml-4 space-x-2">
                        <span className="text-sm text-gray-700">Go to:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          placeholder="Page"
                          onKeyDown={handleGoToPage}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Team Availability Settings
            </h3>
            <div className="space-y-4">
              {Object.entries(availability).map(([day, settings]) => (
                <div
                  key={day}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) =>
                        handleAvailabilityChange(
                          day,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Available
                    </label>
                  </div>
                  {settings.enabled && (
                    <>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">From:</label>
                        <input
                          type="time"
                          value={settings.start}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              day,
                              "start",
                              e.target.value
                            )
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">To:</label>
                        <input
                          type="time"
                          value={settings.end}
                          onChange={(e) =>
                            handleAvailabilityChange(day, "end", e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                Save Availability Settings
              </button>
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Team Members
              </h3>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                Add Team Member
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Senior Support Specialist",
                  email: "sarah@company.com",
                  status: "online",
                },
                {
                  name: "Mike Chen",
                  role: "Technical Support",
                  email: "mike@company.com",
                  status: "busy",
                },
                {
                  name: "Emily Davis",
                  role: "Customer Success",
                  email: "emily@company.com",
                  status: "offline",
                },
              ].map((member, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {member.name}
                      </h4>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        member.status === "online"
                          ? "bg-green-400"
                          : member.status === "busy"
                          ? "bg-yellow-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{member.email}</p>
                  <div className="mt-3 flex space-x-2">
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">
                      Edit
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Update Session Modal */}
      {showUpdateModal && selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Update Session
                </h3>
                <button
                  onClick={closeUpdateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(handleUpdateSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Agent
                  </label>
                  <select
                    {...register("agentId")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select an agent...</option>
                    {availableAgents.map((agent, index) => (
                      <option key={agent._id ?? index} value={agent.name}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register("status", { required: "Status is required" })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="escalated">Escalated</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    {...register("priority", { required: "Priority is required" })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Add any notes or comments..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeUpdateModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Updating..." : "Update Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
