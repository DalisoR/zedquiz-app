import PropTypes from 'prop-types';
import React from 'react';

/**
 * @component TutorApplicationPage
 * @category teacher
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { TutorApplicationPage } from './TutorApplicationPage';
 *
 * function Example() {
 *   return (
 *     <TutorApplicationPage>
 *       [Add example usage]
 *     </TutorApplicationPage>
 *   );
 * }
 * ```
 */

// Convert the existing component content
import React, { useState, useEffect } from 'react';

import { useFormValidation } from '../hooks/useFormValidation';
import { useToastNotification } from '../hooks/useToastNotification';
import { supabase } from '../supabaseClient';
import { trackEvent } from '../utils/analytics';
import { getErrorMessage } from '../utils/errorHandling';

import styles from './TutorApplicationPage.module.css';
import { Skeleton } from './ui/Skeleton';

const initialFormState = {
  email: '',
  password: '',
  fullName: '',
  phoneNumber: '',
  qualifications: '',
  cvFile: null,
  certsFile: null
};

function TutorApplicationPage({ setPage }) {
  const [pageLoading, setPageLoading] = useState(true);
  const { showSuccess, showError, showInfo, dismissToast } = useToastNotification();

  const form = useFormValidation(initialFormState);
  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    setValues,
    handleChange,
    handleBlur,
    handleSubmit
  } = form;

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = field => event => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fakeEvent = {
        target: {
          name: field,
          value: file,
          files: [file]
        }
      };
      handleChange(fakeEvent);

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        // Handle file size error
        const errorEvent = {
          target: {
            name: field,
            value: file
          }
        };
        // This will trigger validation in the form hook
        handleBlur(errorEvent);
      }
    }
  };

  const onSubmit = async formValues => {
    try {
      setIsSubmitting(true);

      // Show loading toast
      const toastId = showInfo('Submitting your application...', {
        title: 'Processing',
        duration: false, // Don't auto-dismiss
        className: 'toast-loading'
      });

      try {
        // Handle file uploads
        const uploadFile = async (file, path) => {
          if (!file) return null;

          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${path}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('tutor-applications')
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`file-upload:${uploadError.message}`);
          }

          const {
            data: { publicUrl }
          } = supabase.storage.from('tutor-applications').getPublicUrl(filePath);

          return publicUrl;
        };

        // Upload files in parallel with progress updates
        showInfo('Uploading your documents...', {
          title: 'Uploading',
          duration: false,
          className: 'toast-loading',
          id: toastId
        });

        const [cvUrl, certsUrl] = await Promise.all([
          uploadFile(formValues.cvFile, 'cv'),
          uploadFile(formValues.certsFile, 'certificates')
        ]);

        // Submit application data
        showInfo('Finalizing your application...', {
          title: 'Almost there',
          duration: false,
          className: 'toast-loading',
          id: toastId
        });

        const { error } = await supabase.from('tutor_applications').insert([
          {
            user_id: (await supabase.auth.getSession()).data.session.user.id,
            full_name: formValues.fullName,
            phone_number: formValues.phoneNumber,
            qualifications: formValues.qualifications,
            cv_url: cvUrl,
            certificates_url: certsUrl,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);

        if (error) throw error;

        // Show success message and track
        showSuccess(
          'Application submitted successfully! We will review your application and get back to you within 3-5 business days.',
          {
            title: 'Success!',
            duration: 10000
          }
        );

        trackEvent('tutor_application_submitted', 'application', 'success');

        // Redirect after a short delay
        setTimeout(() => {
          setPage('landing');
        }, 2000);
      } catch (error) {
        // Dismiss loading toast
        dismissToast(toastId);

        console.error('Submission error:', error);
        const errorMessage = getErrorMessage(error);

        showError(error, {
          title: 'Submission Failed',
          showReportLink: true,
          action: (
            <button
              className='mt-2 text-sm font-medium text-red-700 hover:underline'
              onClick={() => {
                // Pre-fill the form with previous values
                setValues(formValues);
              }}
            >
              Try again
            </button>
          )
        });

        trackEvent('tutor_application_error', 'application', errorMessage);
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      // This will catch any unhandled errors
      console.error('Unexpected error:', error);
      showError(
        'An unexpected error occurred. Please try again later or contact support if the problem persists.',
        {
          title: 'Oops!',
          showReportLink: true
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className='main-container'>
        <header className='main-header'>
          <Skeleton width='250px' height='32px' />
          <Skeleton width='120px' height='36px' />
        </header>
        <div className='content-body'>
          <div className='card'>
            <Skeleton width='200px' height='24px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='40px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='40px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='40px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='40px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='100px' style={{ marginBottom: '1rem' }} />
            <Skeleton height='40px' style={{ marginBottom: '1rem' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Become a ZedQuiz Teacher</h2>
        <button
          className='back-button'
          onClick={() => !isSubmitting && setPage('landing')}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Back to Home'}
        </button>
      </header>

      <div className='content-body'>
        <div className='card'>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                id='email'
                name='email'
                type='email'
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.email && touched.email ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.email && touched.email && <div className='error-message'>{errors.email}</div>}
            </div>

            <div className='form-group'>
              <label htmlFor='password'>Password (min 8 characters)</label>
              <input
                id='password'
                name='password'
                type='password'
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.password && touched.password ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.password && touched.password && (
                <div className='error-message'>{errors.password}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='fullName'>Full Name</label>
              <input
                id='fullName'
                name='fullName'
                type='text'
                value={values.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.fullName && touched.fullName ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.fullName && touched.fullName && (
                <div className='error-message'>{errors.fullName}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='phoneNumber'>Phone Number</label>
              <input
                id='phoneNumber'
                name='phoneNumber'
                type='tel'
                value={values.phoneNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder='+1234567890'
                className={`form-control ${
                  errors.phoneNumber && touched.phoneNumber ? 'error' : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.phoneNumber && touched.phoneNumber && (
                <div className='error-message'>{errors.phoneNumber}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='qualifications'>Your Qualifications</label>
              <textarea
                id='qualifications'
                name='qualifications'
                value={values.qualifications}
                onChange={handleChange}
                onBlur={handleBlur}
                rows='4'
                className={`form-control ${
                  errors.qualifications && touched.qualifications ? 'error' : ''
                }`}
                disabled={isSubmitting}
                placeholder='Please list your teaching experience, degrees, and relevant certifications'
              />
              {errors.qualifications && touched.qualifications && (
                <div className='error-message'>{errors.qualifications}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='cvFile'>Upload Your CV (PDF, max 5MB)</label>
              <input
                id='cvFile'
                name='cvFile'
                type='file'
                accept='.pdf'
                onChange={handleFileChange('cvFile')}
                className={`form-control-file ${errors.cvFile && touched.cvFile ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.cvFile && touched.cvFile && (
                <div className='error-message'>{errors.cvFile}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='certsFile'>Upload Your Certificates (PDF, max 5MB)</label>
              <input
                id='certsFile'
                name='certsFile'
                type='file'
                accept='.pdf'
                onChange={handleFileChange('certsFile')}
                className={`form-control-file ${
                  errors.certsFile && touched.certsFile ? 'error' : ''
                }`}
                disabled={isSubmitting}
              />
              {errors.certsFile && touched.certsFile && (
                <div className='error-message'>{errors.certsFile}</div>
              )}
            </div>

            <div className='form-actions'>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                onClick={() => trackEvent('tutor_application_submit_click', 'form', 'submit')}
              >
                {isSubmitting ? (
                  <>
                    <span className='spinner'></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

TutorApplicationPage.propTypes = {
  // Add prop types
};

TutorApplicationPage.defaultProps = {
  // Add default props
};

export default TutorApplicationPage;
