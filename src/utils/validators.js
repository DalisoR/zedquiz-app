export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
};

export const validateName = (name) => {
  if (!name?.trim()) return 'Name is required';
  if (name.length < 2) return 'Name is too short';
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!/^\+?[0-9\s-]{10,}$/.test(phone)) return 'Enter a valid phone number';
  return '';
};

export const validateFile = (file, fieldName) => {
  if (!file) return `${fieldName} is required`;
  if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB';
  if (file.type !== 'application/pdf') return 'Only PDF files are allowed';
  return '';
};
