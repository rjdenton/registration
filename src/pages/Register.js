import React from 'react';
import CourseRegistrationForm from '../components/RegistrationForm'; // Make sure the path is correct

const Register = () => {
  return (
    <div className="register-page">
      <h1>Course Registration</h1>
      <p>Fill out the form below to register for your courses.</p>
      <CourseRegistrationForm />
    </div>
  );
};

export default Register;


