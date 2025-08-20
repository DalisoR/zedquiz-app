import React from 'react';

export const TutorApplicationForm = ({
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleFileChange,
  handleSubmit
}) => (
  <form onSubmit={handleSubmit}>
    <div className='form-group'>
      <label htmlFor='email'>Email</label>
      <input
        id='email'
        name='email'
        type='email'
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        className={errors.email && touched.email ? 'error' : ''}
      />
      {errors.email && touched.email && <div className='error-message'>{errors.email}</div>}
    </div>

    <div className='form-group'>
      <label htmlFor='password'>Password</label>
      <input
        id='password'
        name='password'
        type='password'
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        className={errors.password && touched.password ? 'error' : ''}
      />
      {errors.password && touched.password && (
        <div className='error-message'>{errors.password}</div>
      )}
    </div>

    <div className='form-actions'>
      <button type='submit' disabled={isSubmitting} className={isSubmitting ? 'loading' : ''}>
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
);
