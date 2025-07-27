import { clientUrl } from "./constants.js";

// Utility function to format dates for email templates
export const formatDateForEmail = (date) => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
};

// Utility function to generate meeting links
export const generateMeetingLink = (sessionId) => {
    return `${clientUrl || 'http://localhost:3000'}/video-call/${sessionId}`;
};

// Utility function to validate email addresses
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Utility function to generate session IDs
export const generateSessionId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
};