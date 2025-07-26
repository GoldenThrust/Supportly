interface BookingFormData {
  name: string;
  email: string;
  description: string;
  category: string;
  subject: string;
  type: 'technical' | 'billing' | 'general' | 'complaint' | 'feature_request';
}