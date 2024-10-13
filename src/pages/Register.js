import React, { useState } from 'react';
import '../styles/register.css';  // Import the CSS for styling

function Register() {
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');

  const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can add logic to submit the form data, e.g., send to backend
    console.log('Selected Major:', major);
    console.log('Selected Semester:', semester);
  };

  return (
    <div className="register-container">
      <div className="form-section">
        <h2>Course Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="major">Select Major:</label>
            <select id="major" value={major} onChange={handleMajorChange}>
              <option value="">--Select Major--</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business">Business</option>
              <option value="Biology">Biology</option>
              <option value="Psychology">Psychology</option>
              {/* Add more majors as needed */}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="semester">Select Semester:</label>
            <select id="semester" value={semester} onChange={handleSemesterChange}>
              <option value="">--Select Semester--</option>
              <option value="Fall 2024">Fall 2024</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
              {/* Add more semesters as needed */}
            </select>
          </div>

          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="recommendation-section">
        <h2>Future Course Recommendations</h2>
        <p>Once the course recommendation system is implemented, recommended courses will be displayed here based on your major and semester selection.</p>
      </div>
    </div>
  );
}

export default Register;

