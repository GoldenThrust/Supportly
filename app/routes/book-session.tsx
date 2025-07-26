import type { Route } from "./+types/book-session";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAppSelector } from "~/store/hooks";
import { selectAuth } from "~/store/selectors";

interface BookingFormData {
  name: string;
  email: string;
  reason: string;
  category: string;
  subject: string;
  type: "technical" | "billing" | "general" | "complaint" | "feature_request";
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Book Support Session - Supportly" },
    {
      name: "description",
      content: "Schedule a video call with our support team",
    },
  ];
}

export default function BookSession() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAppSelector(selectAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<BookingFormData>({
    defaultValues: {
      name: "",
      email: "",
      reason: "",
      category: "",
      subject: "",
      type: "general",
    },
  });

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setValue("name", user.name || "");
      setValue("email", user.email || "");
    }
  }, [isAuthenticated, user, setValue]);

  const availableTimes = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time");
      return;
    }

    try {
      const bookingData = {
        ...data,
        selectedDate,
        selectedTime,
        userId: isAuthenticated && user ? user.id : null,
      };

      // TODO: Replace with actual API call
      console.log("Booking submitted:", bookingData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to confirmation page
      navigate("/booking-confirmation", {
        state: {
          booking: bookingData,
          sessionDetails: {
            date: selectedDate,
            time: selectedTime,
            duration: "30 minutes",
          },
        },
      });
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book session. Please try again.");
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
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600 text-sm">
                    Welcome, {user?.name || "User"}
                  </span>
                  <Link
                    to="/dashboard"
                    className="text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/logout"
                    className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Support Session
          </h1>
          <p className="text-lg text-gray-600">
            Schedule a video call with our support team to resolve your issues
            quickly
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Form Section */}
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Tell us about yourself
              </h2>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6 text-black"
              >
                {/* Personal Information Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register("name", {
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-300"
                    placeholder="Enter your full name"
                    disabled={isAuthenticated && !!user?.name}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                  {isAuthenticated && user?.name && (
                    <p className="mt-1 text-sm text-green-600">
                      Using your account information
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-300"
                    placeholder="Enter your email address"
                    disabled={isAuthenticated && !!user?.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                  {isAuthenticated && user?.email && (
                    <p className="mt-1 text-sm text-green-600">
                      Using your account email
                    </p>
                  )}
                </div>

                {/* Support Type Section */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Support Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        {...register("category", {
                          required: "Please select a support category",
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option selected value="general">
                          General Support
                        </option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Question</option>
                        <option value="complaint">Complaint</option>
                        <option value="feature_request">Feature Request</option>
                      </select>
                      {errors.type && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.type.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        {...register("subject", {
                          required: "Subject is required",
                          minLength: {
                            value: 5,
                            message: "Subject must be at least 5 characters",
                          },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Brief summary of your issue or request"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detailed Description *
                      </label>
                      <textarea
                        {...register("reason", {
                          required:
                            "Please describe the reason for your session",
                          minLength: {
                            value: 10,
                            message:
                              "Please provide more details (at least 10 characters)",
                          },
                        })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Describe the issue you're facing or what you need help with in detail..."
                      />
                      {errors.reason && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.reason.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Scheduling Section */}
            <div className="bg-gray-50 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Choose Date & Time
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots *
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 text-sm rounded-md border ${
                          selectedTime === time
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <h3 className="font-medium text-indigo-900 mb-2">
                      Session Summary
                    </h3>
                    <p className="text-sm text-indigo-700">
                      <strong>Date:</strong>{" "}
                      {new Date(selectedDate).toLocaleDateString()}
                      <br />
                      <strong>Time:</strong> {selectedTime}
                      <br />
                      <strong>Duration:</strong> 30 minutes
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || !selectedDate || !selectedTime}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium"
                >
                  {isSubmitting ? "Booking..." : "Book Support Session"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            What to Expect
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              You'll receive a video call link via email 15 minutes before your
              session
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Our support expert will guide you through the solution
              step-by-step
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Session recordings are available for future reference
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              No additional software required - works in your browser
            </li>
          </ul>
        </div>

        {/* Authentication prompt for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-600 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-medium mb-2">
                  Get the Best Experience
                </h4>
                <p className="text-yellow-700 text-sm mb-3">
                  Sign in to automatically fill your details, view your booking
                  history, and receive personalized support.
                </p>
                <div className="flex space-x-3">
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
