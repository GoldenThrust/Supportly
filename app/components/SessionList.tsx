import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSessions, createSession } from '../store/slices/supportSessionSlice';
import type { SupportSession } from '../store/slices/supportSessionSlice';
import { Button } from '../components';

export function SessionList() {
  const dispatch = useAppDispatch();
  const { sessions, isLoading, error } = useAppSelector((state) => state.supportSession);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleCreateSession = () => {
    const sessionData = {
      title: 'Support Session',
      description: 'Need help with my account',
      scheduledAt: new Date().toISOString(),
    };
    
    dispatch(createSession(sessionData));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Support Sessions</h2>
        <Button onClick={handleCreateSession}>
          Create New Session
        </Button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session: SupportSession) => (
          <div
            key={session.id}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{session.title}</h3>
                <p className="text-gray-600 mt-1">{session.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled: {new Date(session.scheduledAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : session.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : session.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {session.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No sessions found. Create your first session!</p>
        </div>
      )}
    </div>
  );
}
