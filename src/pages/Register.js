import React, { useState } from 'react';
import { useUser } from '../components/UserContext'; // Import the useUser hook
import '../styles/register.css'; // Import the CSS for styling

function Register() {
  const { user } = useUser(); // Access user data
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);

  const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Selected Major:', major);  // Debug log
    console.log('User ID:', user?.student_id);  // Debug log

    if (!major || !user?.student_id) {
        console.error('Missing major or student ID');
        return;
    }

    const encodedMajor = encodeURIComponent(major);  // Encode the major name
    const apiUrl = `http://127.0.0.1:5000/api/recommendations?major_name=${encodedMajor}&student_id=${user.student_id}`;
    console.log('Request URL:', apiUrl);  // Log the full URL

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Recommended Courses:', data);
        setCourses(data);
    } catch (error) {
        console.error('Error fetching recommended courses:', error);
    }
};




  return (
    <div className="register-container">
      <h2>Welcome, {user?.name || 'User'}!</h2> {/* Display the user's name */}
      <div className="form-section">
        <h2>Course Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="major">Select Major:</label>
            <select id="major" value={major} onChange={handleMajorChange}>
              <option value="">--Select Major--</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Marine Biology">Marine Biology</option>
              <option value="Mathematics">Mathematics</option>
              {/* Add more majors as needed */}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="semester">Select Semester:</label>
            <select id="semester" value={semester} onChange={handleSemesterChange}>
              <option value="">--Select Semester--</option>
              <option value="Spring 2025">Spring 2025</option>
              <option value="Summer 2025">Summer 2025</option>
              <option value="Fall 2025">Fall 2025</option>
              {/* Add more semesters as needed */}
            </select>
          </div>

          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="recommendation-section">
          <h2>Course Recommendations</h2>
          {courses.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.course_id}>
                    <td>{course.name}</td>
                    <td>{course.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No courses available for the selected major and semester.</p>
          )}
       </div>
    </div>
  );
}

export default Register;



