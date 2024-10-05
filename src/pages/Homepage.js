import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container mt-5">
      <h1>Welcome to the Registration System</h1>
      <p>
        This is the home of the course registration system. You can register, view available courses, manage waitlists, and much more!
      </p>
      <div className="mt-4">
        <Link to="/register" className="btn btn-primary me-2">
          Register
        </Link>
        <Link to="/login" className="btn btn-secondary">
          Login
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
