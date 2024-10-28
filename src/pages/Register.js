import React, { useState, useEffect } from 'react';
import { useUser } from '../components/UserContext'; // Import the useUser hook
import '../styles/register.css'; // Import the CSS for styling

function Register() {
  const { user } = useUser(); // Access user data
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]); // All available courses
  const [selectedCourses, setSelectedCourses] = useState([]); // Tracks selected courses
  const [registeredCourses, setRegisteredCourses] = useState([]); // Registered courses
  const [unregisteringCourses, setUnregisteringCourses] = useState([]); // Tracks courses being unregistered

  const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

// Fetch registered courses on component mount
useEffect(() => {
  const fetchRegisteredCourses = async () => {
    console.log('Fetching registered courses for student ID:', user?.student_id);
    if (user?.student_id) {
      const response = await fetch(`http://127.0.0.1:5000/api/registered_courses?student_id=${user.student_id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Registered courses data:', data);
        setRegisteredCourses(data);
      } else {
        console.error('Error fetching registered courses:', response.statusText);
      }
    }
  };

  fetchRegisteredCourses();
}, [user]);



  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!major || !user?.student_id) {
      console.error('Missing major or student ID');
      return;
    }

    const encodedMajor = encodeURIComponent(major);  // Encode the major name
    const apiUrl = `http://127.0.0.1:5000/api/recommendations?major_name=${encodedMajor}&student_id=${user.student_id}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setCourses(data); // Set available courses from API
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
    }
  };

  // Handle checkbox changes for selecting courses to register
  const handleCheckboxChange = (courseId) => {
    setSelectedCourses((prevSelected) =>
      prevSelected.includes(courseId)
        ? prevSelected.filter((id) => id !== courseId) // Deselect if already selected
        : [...prevSelected, courseId] // Select if not selected
    );
  };

  // Handle registering selected courses
 const handleRegister = async () => {
    const selected = courses.filter((course) =>
        selectedCourses.includes(course.course_id)
    );

    const updatedRegisteredCourses = selected.map((course) => ({
        ...course,
        status: course.seats_available > 0 ? 'Registered' : 'Waitlist'
    }));

    // For each selected course, make a backend call to decrease seats
    for (let course of selected) {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/register_course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course_id: course.course_id,
                    student_id: user.student_id,  // Pass the student_id
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Error registering course:', data.error);
                alert(`Could not register for ${course.name}: ${data.error}`);
                return;
            } else {
                console.log(`Registered for ${course.name}`);
            }
        } catch (error) {
            console.error('Error registering course:', error);
        }
    }

    // Move selected courses to registered list and remove from available list
    setRegisteredCourses((prevRegistered) => [
        ...prevRegistered,
        ...updatedRegisteredCourses,
    ]);
    setCourses((prevCourses) =>
        prevCourses.filter((course) => !selectedCourses.includes(course.course_id))
    );

    // Clear selected courses
    setSelectedCourses([]);
};

  // Handle showing the "Remove" button when a user wants to unregister a course
  const handleUnregisterCheckboxChange = (courseId) => {
    setUnregisteringCourses((prevUnregistering) =>
      prevUnregistering.includes(courseId)
        ? prevUnregistering.filter((id) => id !== courseId) // Uncheck
        : [...prevUnregistering, courseId] // Check
    );
  };

  // Handle unregistering a course when the "Remove" button is clicked
  const handleUnregister = async () => {
  // Separate remaining and unregistered courses
  const remainingCourses = registeredCourses.filter(
    (course) => !unregisteringCourses.includes(course.course_id)
  );
  const unregisteredCourses = registeredCourses.filter(
    (course) => unregisteringCourses.includes(course.course_id)
  );

  // For each unregistered course, increase seats in the database
  for (let course of unregisteredCourses) {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/unregister_course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: course.course_id,
          student_id: user.student_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Error unregistering course ${course.name}:`, data.error);
        alert(`Could not unregister ${course.name}: ${data.error}`);
        return;
      } else {
        console.log(`Unregistered ${course.name} and increased seats.`);
      }
    } catch (error) {
      console.error(`Error unregistering course ${course.name}:`, error);
    }
  }

  // Update state to remove unregistered courses from registered list and add them to available courses
  setCourses((prevCourses) => [...prevCourses, ...unregisteredCourses]);
  setRegisteredCourses(remainingCourses);

  // Clear the unregistering courses list
  setUnregisteringCourses([]);
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
                <th>Select</th> {/* Add column for checkboxes */}
                <th>Course Name</th>
                <th>Credits</th>
                <th>Available Seats</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.course_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.course_id)}
                      onChange={() => handleCheckboxChange(course.course_id)}
                    />
                  </td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                  <td>{course.seats_available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No courses available for the selected major and semester.</p>
        )}
        {selectedCourses.length > 0 && (
          <button onClick={handleRegister}>Register</button> // Register button
        )}
      </div>

      <div className="registered-section">
          <h2>Registered Courses</h2>
          {registeredCourses.length > 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Course Name</th>
                    <th>Credits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredCourses.map((course) => (
                    <tr key={course.course_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={unregisteringCourses.includes(course.course_id)}
                          onChange={() => handleUnregisterCheckboxChange(course.course_id)}
                        />
                      </td>
                      <td>{course.name}</td>
                      <td>{course.credits}</td>
                      <td>{course.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unregisteringCourses.length > 0 && (
                <button className="remove-btn" onClick={handleUnregister}>
                  Remove Selected Courses
                </button>
              )}
            </>
          ) : (
            <p>No courses registered yet.</p>
          )}
        </div>
    </div>
  );
}

export default Register;









