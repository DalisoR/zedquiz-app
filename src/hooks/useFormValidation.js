import { useState, useEffect } from 'react';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateFile
} from '../utils/validators';

export const useFormValidation = (initialState, validate) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      const noErrors = Object.keys(errors).length === 0;
      if (noErrors) {
        // Submit form
        console.log('Form is valid, ready to submit:', values);
      } else {
        setSubmitting(false);
      }
    }
  }, [errors, isSubmitting, values]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const newValue = files ? files[0] : value;
    
    setValues({
      ...values,
      [name]: newValue
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
    
    // Validate the field that lost focus
    validateField(name, values[name]);
  };

  const validateField = (fieldName, value) => {
    let error = '';
    
    switch (fieldName) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'fullName':
        error = validateName(value);
        break;
      case 'phoneNumber':
        error = validatePhone(value);
        break;
      case 'qualifications':
        error = value?.trim() ? '' : 'Please enter your qualifications';
        break;
      case 'cvFile':
        error = validateFile(value, 'CV');
        break;
      case 'certsFile':
        error = validateFile(value, 'Certificates');
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error || null
    }));

    return !error; // Return true if valid
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(values).forEach(key => {
      const fieldValue = values[key];
      let error = '';

      if (key === 'email') error = validateEmail(fieldValue);
      else if (key === 'password') error = validatePassword(fieldValue);
      else if (key === 'fullName') error = validateName(fieldValue);
      else if (key === 'phoneNumber') error = validatePhone(fieldValue);
      else if (key === 'qualifications') error = fieldValue?.trim() ? '' : 'Required';
      else if (key === 'cvFile') error = validateFile(fieldValue, 'CV');
      else if (key === 'certsFile') error = validateFile(fieldValue, 'Certificates');

      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (validateForm()) {
      onSubmit(values);
    } else {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    setValues,
    setErrors,
    setTouched,
    setSubmitting
  };
};
