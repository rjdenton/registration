import React from 'react';
import CourseAvailability from '../components/CourseAvailability';
import WaitlistManagement from '../components/WaitlistManagement';

const Dashboard = () => {
  return (
    <div className="container mt-5">
      <h2>Your Dashboard</h2>
      <p>Welcome to your dashboard! Here you can check course availability, manage your waitlists, and view recommendations.</p>

      <div className="mt-4">
        {/* Show real-time course availability */}
        <CourseAvailability />

        {/* Manage waitlist */}
        <WaitlistManagement />
      </div>
    </div>
  );
};

export default Dashboard;
