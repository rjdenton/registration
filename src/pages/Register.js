import React, { useState, useEffect } from 'react';
import { useUser } from '../components/UserContext';
import '../styles/register.css';

function Register() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('current'); // Track active tab
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]); // All available courses
  const [selectedCourses, setSelectedCourses] = useState([]); // Tracks selected courses
  const [registeredCourses, setRegisteredCourses] = useState([]); // Registered courses
  const [unregisteringCourses, setUnregisteringCourses] = useState([]); // Tracks courses being unregistered
  const [currentRegistrations, setCurrentRegistrations] = useState([]); // Currently registered courses
  const [waitlistCourses, setWaitlistCourses] = useState([]); // Waitlisted courses

  const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  // Fetch registered courses on component mount
  useEffect(() => {
    const fetchRegisteredCourses = async () => {
      if (user?.student_id) {
        const response = await fetch(`http://127.0.0.1:5000/api/registered_courses?student_id=${user.student_id}`);
        if (response.ok) {
          const data = await response.json();
          setRegisteredCourses(data);
        } else {
          console.error('Error fetching registered courses:', response.statusText);
        }
      }
    };

    fetchRegisteredCourses();
  }, [user]);

  // Fetch currently registered courses on component mount
  const fetchCurrentRegistrations = async () => {
      if (user?.student_id) {
        const response = await fetch(`http://127.0.0.1:5000/api/registered_courses?student_id=${user.student_id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentRegistrations(data);
        } else {
          console.error('Error fetching current registrations:', response.statusText);
        }
      }
    };

  useEffect(() => {
    fetchCurrentRegistrations();

    // Function to be used for re-fetching data on tab change
    const fetchDataOnTabChange = () => {
      if (activeTab === 'current') {
        fetchCurrentRegistrations();
      } else if (activeTab === 'available') {
        handleSubmit({ preventDefault: () => {} });
      }
    };

    fetchDataOnTabChange();
  }, [user, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (tab === 'current' && user?.student_id) {
      fetchCurrentRegistrations();
    } else if (tab === 'available' && user?.student_id) {
      handleSubmit({ preventDefault: () => {} });
    }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!major || !user?.student_id) return;

    const encodedMajor = encodeURIComponent(major);
    const apiUrl = `http://127.0.0.1:5000/api/recommendations?major_name=${encodedMajor}&student_id=${user.student_id}`;

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        let data = await response.json();
        // Filter out courses that are already registered
        data = data.filter((course) => !currentRegistrations.some((reg) => reg.course_id === course.course_id));
        setCourses(data);
      }
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

    // For each selected course, make a backend call to either register or add to waitlist
    for (let course of selected) {
      try {
        if (course.seats_available > 0) {
          // Register the course
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

          if (!response.ok) {
            const data = await response.json();
            console.error('Error registering course:', data.error);
            alert(`Could not register for ${course.name}: ${data.error}`);
            return;
          } else {
            console.log(`Registered for ${course.name}`);
          }
        } else {
          // Add to waitlist
          const response = await fetch('http://127.0.0.1:5000/api/waitlist_course', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_id: course.course_id,
              student_id: user.student_id,  // Pass the student_id
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            console.error('Error adding to waitlist:', data.error);
            alert(`Could not add to waitlist for ${course.name}: ${data.error}`);
            return;
          } else {
            console.log(`Added to waitlist for ${course.name}`);

            // Decrement waitlist seats by 1
            const waitlistResponse = await fetch(`http://127.0.0.1:5000/api/decrement_waitlist_seats?course_id=${course.course_id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (!waitlistResponse.ok) {
              const data = await waitlistResponse.json();
              console.error('Error decrementing waitlist seats:', data.error);
              alert(`Could not decrement waitlist seats for ${course.name}: ${data.error}`);
              return;
            } else {
              console.log(`Decremented waitlist seats for ${course.name}`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing course:', error);
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
  }

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

        if (!response.ok) {
          const data = await response.json();
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

    // Refetch current registrations
    fetchCurrentRegistrations();
  };

  return (
    <div className="register-container">
      <h2>Welcome, {user?.name || 'User'}!</h2>

      <div className="container expanded-container" style={{ maxWidth: '1600px', minWidth: '1200px' }}>
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => handleTabChange('current')}
          >
            Currently Registered
          </div>
          <div
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => handleTabChange('available')}
          >
            Available Courses
          </div>
          <div
            className={`tab ${activeTab === 'waitlist' ? 'active' : ''}`}
            onClick={() => handleTabChange('waitlist')}
          >
            Waitlist
          </div>
          <div
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => handleTabChange('completed')}
          >
            Completed Courses
          </div>
        </div>

        <div className="content">
          {activeTab === 'available' && (
            <div className="form-container expanded-form-container">
              <form onSubmit={handleSubmit} className="styled-form">
                <div className="form-group">
                  <label htmlFor="major">Select Major:</label>
                  <select id="major" value={major} onChange={handleMajorChange} className="styled-select">
                    <option value="">--Select Major--</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Management Information System">Management Information System</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="semester">Select Semester:</label>
                  <select id="semester" value={semester} onChange={handleSemesterChange} className="styled-select">
                    <option value="">--Select Semester--</option>
                    <option value="Spring 2025">Spring 2025</option>
                    <option value="Summer 2025">Summer 2025</option>
                    <option value="Fall 2025">Fall 2025</option>
                  </select>
                </div>
                <button type="submit" className="styled-button">Submit</button>
              </form>

              {courses.length > 0 ? (
                <div className="courses-table-container">
                  <table className="courses-table full-width styled-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Course ID</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Available Seats</th>
                        <th>Waitlist Seats</th>
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
                          <td>{course.course_id}</td>
                          <td>{course.name}</td>
                          <td>{course.credits}</td>
                          <td>{course.seats_available}</td>
                          <td>{course.waitlist_seats}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-courses-message">No courses available for the selected major and semester.</p>
              )}
            </div>
          )}

          {activeTab === 'waitlist' && (
            <div className="waitlist-courses">
              <h2>Waitlisted Courses</h2>
              <p className="no-courses-message">This section will show waitlisted courses (if any).</p>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="completed-courses">
              <h2>Completed Courses</h2>
              <p className="no-courses-message">This section will show completed courses (if any).</p>
            </div>
          )}

          {activeTab === 'current' && (
            <div className="current-registrations">
              <h2>Currently Registered Courses</h2>
              {currentRegistrations.length > 0 ? (
                <table className="courses-table full-width styled-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Course ID</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRegistrations.map((course) => (
                      <tr key={course.course_id}>
                        <td>
                            <input
                            type="checkbox"
                            checked={unregisteringCourses.includes(course.course_id)}
                            onChange={() => handleUnregisterCheckboxChange(course.course_id)}
                            />
                        </td>
                        <td>{course.course_id}</td>
                        <td>{course.name}</td>
                        <td>{course.credits}</td>
                        <td>{course.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-courses-message">No courses currently registered.</p>
              )}
            </div>
          )}
        </div>

        {activeTab === 'current' && unregisteringCourses.length > 0 && (
                <div className="submit-container">
                    <button type="button" onClick={handleUnregister} className="remove-btn">
                        Remove Selected Courses
                    </button>
                </div>
        )}
        {activeTab === 'available' && selectedCourses.length > 0 && (
          <div className="submit-container">
            <button type="button" onClick={handleRegister} className="styled-button">
              Register Selected Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
