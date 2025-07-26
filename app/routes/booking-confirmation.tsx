import { Link, useLocation } from "react-router";
import { useAppSelector } from "~/store/hooks";
import { selectSessions } from "~/store/selectors";

export function meta() {
  return [
    { title: "Booking Confirmed - Supportly" },
    { name: "description", content: "Your support session has been confirmed" },
  ];
}

export default function BookingConfirmation() {
  const location = useLocation();
  const { booking, sessionDetails } = location.state || {};

  const session = useAppSelector(selectSessions);
  const latestSession = session.length > 0 ? session[session.length - 1] : null;

  const bookingDetails = {
    id: latestSession?.id || booking?.id || `SPT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    customerName: booking?.name || "Guest User",
    customerEmail: booking?.email || "guest@example.com",
    date: latestSession?.scheduledAt ? new Date(latestSession.scheduledAt).toISOString().split('T')[0] : (booking?.date || sessionDetails?.date || new Date().toISOString().split('T')[0]),
    time: latestSession?.scheduledAt ? new Date(latestSession.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : (booking?.time || sessionDetails?.time || "10:00"),
    supportAgent: latestSession?.supporterId || "Not assigned yet",
    reason: latestSession?.description || booking?.description || "General support session",
    subject: latestSession?.title || booking?.subject || "Support Session",
    category: booking?.category || "general",
    meetingLink: latestSession?.meetingLink || `https://supportly.com/video-call/${latestSession?.id || booking?.id || 'session'}`,
    duration: sessionDetails?.duration || "30 minutes",
    status: latestSession?.status || "pending",
    createdAt: latestSession?.createdAt || new Date().toISOString(),
  };

  // If no booking data is available, show a message
  if (!booking && !sessionDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
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
            </div>
          </div>
        </nav>
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Booking Found</h1>
          <p className="text-lg text-gray-600 mb-8">
            It looks like you accessed this page directly. Please book a session first.
          </p>
          <Link 
            to="/book-session"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Book a Session
          </Link>
        </div>
      </div>
    );
  }

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
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your support session has been successfully scheduled. We'll see you
            soon!
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                Session Details
              </h2>
              {latestSession && (
                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                  Session #{latestSession.id}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Session Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Booking ID:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {bookingDetails.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Date:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {new Date(bookingDetails.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Time:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {bookingDetails.time} ({bookingDetails.duration})
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Support Type:
                    </span>
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {bookingDetails.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Support Agent:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {bookingDetails.supportAgent}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Status:
                    </span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      bookingDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bookingDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                      bookingDetails.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {bookingDetails.status.charAt(0).toUpperCase() + bookingDetails.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Name:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {bookingDetails.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Email:
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {bookingDetails.customerEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meeting Link Section - Show if available */}
            {bookingDetails.meetingLink && latestSession && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Meeting Information
                </h3>
                <div className="bg-indigo-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-indigo-900">Meeting Link:</span>
                      <p className="text-sm text-indigo-700 mt-1">
                        {bookingDetails.meetingLink}
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(bookingDetails.meetingLink, '_blank')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Join Session
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                Session Topic
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">Subject:</span>
                  <span className="ml-2 text-sm text-gray-600">{bookingDetails.subject}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{bookingDetails.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            What Happens Next?
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">
                  Confirmation Email
                </h4>
                <p className="text-blue-700 text-sm">
                  You'll receive a confirmation email with all the details and
                  preparation instructions.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Meeting Link</h4>
                <p className="text-blue-700 text-sm">
                  15 minutes before your session, you'll receive an email with
                  the video call link.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Join the Session</h4>
                <p className="text-blue-700 text-sm">
                  Click the link at your scheduled time to start your support
                  session.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              const subject = encodeURIComponent(
                `Support Session - ${bookingDetails.id}`
              );
              const body = encodeURIComponent(
                `Meeting Link: ${
                  bookingDetails.meetingLink
                }\n\nDate: ${new Date(
                  bookingDetails.date
                ).toLocaleDateString()}\nTime: ${
                  bookingDetails.time
                }\n\nSee you at the session!`
              );
              window.open(`mailto:?subject=${subject}&body=${body}`);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Add to Calendar
          </button>

          <Link
            to="/"
            className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium text-center"
          >
            Back to Home
          </Link>

          <Link
            to="/book-session"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium text-center"
          >
            Book Another Session
          </Link>
        </div>

        {/* Contact Information */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need to Make Changes?
          </h3>
          <p className="text-gray-600 mb-4">
            If you need to reschedule or cancel your session, please contact us
            at least 2 hours in advance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a
              href="mailto:support@supportly.com"
              className="text-indigo-600 hover:text-indigo-800"
            >
              📧 support@supportly.com
            </a>
            <a
              href="tel:+1234567890"
              className="text-indigo-600 hover:text-indigo-800"
            >
              📞 +1 (234) 567-8900
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
