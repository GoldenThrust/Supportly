interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  phone?: string;
  preferences?: Record<string, any>;
}