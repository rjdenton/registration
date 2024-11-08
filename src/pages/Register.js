import React, { useState, useEffect } from 'react';
import useRegistration from '../components/useRegistration.js';
import { useUser } from '../components/UserContext';
import '../styles/register.css';
import io from 'socket.io-client';

function Register() {
  const { user } = useUser();
  const {
    major,
    setMajor,
    semester,
    setSemester,
    courses,
    selectedCourses,
    setSelectedCourses,
    registeredCourses,
    unregisteringCourses,
    currentRegistrations,
    fetchCurrentRegistrations,
    handleRegister,
    handleUnregister,
    handleTabChange,
    handleCheckboxChange,
    handleSubmit,
    handleUnregisterCheckboxChange,
    handleMajorChange,
    handleSemesterChange,
    activeTab,
    setActiveTab,
    completedCourses,
    removingWaitlistCourses,
    handleWaitlistCheckboxChange,
    handleRemoveFromWaitlist,
    waitlistCourses,
    setWaitlistCourses
  } = useRegistration(user);

  // Connect to WebSocket
  const socket = io.connect("https://mmis6299-registration-3fe6af6fc84a.herokuapp.com", {
    transports: ["websocket"]
  });

  const [availableSeats, setAvailableSeats] = useState({});
  const [waitlistSeats, setWaitlistSeats] = useState({});
  const [requiredCourses, setRequiredCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [completedCredits, setCompletedCredits] = useState(0);
  const [electiveCourses, setElectiveCourses] = useState([]);
  const [completedElectiveCredits, setCompletedElectiveCredits] = useState(0);
  const [majorName, setMajorName] = useState('');

    const calculateGPA = () => {
      if (requiredCourses.length === 0) return 0;

      const gradePoints = {
        A: 4.0,
        B: 3.0,
        C: 2.0,
        D: 1.0,
        F: 0.0,
      };

      // Filter completed courses and calculate GPA
      const completedCoursesWithGrades = requiredCourses.filter((course) => course.grade && gradePoints[course.grade] !== undefined);
      const totalPoints = completedCoursesWithGrades.reduce((acc, course) => acc + gradePoints[course.grade] * course.credits, 0);
      const totalCredits = completedCoursesWithGrades.reduce((acc, course) => acc + course.credits, 0);

      return totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
    };

  // Fetch required courses for DegreeWorks
      const fetchDegreeWorks = async () => {
      try {
        const response = await fetch(`/api/degreeworks?student_id=${user.student_id}`);
        if (response.ok) {
          const data = await response.json();
          setRequiredCourses(data.required_courses);
          setElectiveCourses(data.elective_courses);
          setTotalCredits(data.total_credits);
          setCompletedCredits(data.completed_credits);

          // Calculate completed elective credits
          const electiveCompleted = data.elective_courses
            .filter(course => ['A', 'B', 'C'].includes(course.grade))
            .reduce((acc, course) => acc + course.credits, 0);
          setCompletedElectiveCredits(electiveCompleted);

        } else {
          console.error("Failed to fetch DegreeWorks data");
        }
      } catch (error) {
        console.error("Error fetching DegreeWorks:", error);
      }
    };

  // Fetch DegreeWorks data when "DegreeWorks" tab is active
  useEffect(() => {
    if (activeTab === 'degreeworks') {
      fetchDegreeWorks();
    }
  }, [activeTab, user]);

    const progressPercentage = totalCredits + 9 ? Math.round(((completedCredits + completedElectiveCredits) / (totalCredits + 9)) * 100) : 0;

  // Initial fetch for current registrations
  useEffect(() => {
    fetchCurrentRegistrations();
  }, [user, fetchCurrentRegistrations]);

  // Handle WebSocket connection and seat updates
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Listener for seat updates
    socket.on("seat_update", (data) => {
      setAvailableSeats((prevSeats) => ({
        ...prevSeats,
        [data.course_id]: data.seats_available,
      }));
      setWaitlistSeats((prevWaitlistSeats) => ({
        ...prevWaitlistSeats,
        [data.course_id]: data.waitlist_seats,
      }));
    });

    // Listener for position updates
    socket.on("position_update", (data) => {
      const { course_id, positions } = data;

      setWaitlistCourses((prevWaitlistCourses) =>
        prevWaitlistCourses.map((course) => {
          if (course.course_id === course_id) {
            const updatedPosition = positions.find(
              (p) => p.student_id === course.student_id
            )?.position;

            return updatedPosition !== undefined
              ? { ...course, position: updatedPosition }
              : course;
          }
          return course;
        })
      );
    });

    return () => {
      socket.off("seat_update");
      socket.off("position_update");
    };
  }, [socket, setWaitlistCourses]);

  // Function to capitalize the user name
  function capitalizeName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return (
    <div className="register-container">
          <h2 style={{
                color: '#007bff',        // Text color
                padding: '10px 20px',    // Padding around the text
                textAlign: 'center',     // Centered text
                fontFamily: 'Arial, sans-serif',  // Font family
            }}>
                Welcome, {capitalizeName(user?.name || 'User')}!
          </h2>


      <div className="container expanded-container" style={{ maxWidth: '1600px', minWidth: '1200px' }}>
        <div className="tabs">
          <div className={`tab ${activeTab === 'current' ? 'active' : ''}`} onClick={() => handleTabChange('current')}>
            Currently Registered
          </div>
          <div className={`tab ${activeTab === 'available' ? 'active' : ''}`}onClick={() => handleTabChange('available')}>
            Available Courses
          </div>
          <div className={`tab ${activeTab === 'waitlist' ? 'active' : ''}`}onClick={() => handleTabChange('waitlist')}>
            Waitlist
          </div>
          <div className={`tab ${activeTab === 'degreeworks' ? 'active' : ''}`} onClick={() => setActiveTab('degreeworks')}>
            DegreeWorks
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
                        {courses
                          .filter(
                            (course) =>
                              !registeredCourses.some((registered) => registered.course_id === course.course_id) &&
                              !waitlistCourses.some((waitlisted) => waitlisted.course_id === course.course_id)
                          )
                          .map((course) => (
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
                              <td>{availableSeats[course.course_id] || course.seats_available}</td>
                              <td>{waitlistSeats[course.course_id] || course.waitlist_seats}</td>
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
                {waitlistCourses.length > 0 ? (
                  <div>
                    <table className="courses-table full-width styled-table">
                      <thead>
                        <tr>
                          <th>Select</th> {/* Checkbox column header */}
                          <th>Course ID</th>
                          <th>Course Name</th>
                          <th>Credits</th>
                          <th>Waitlist Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlistCourses.map((course) => (
                          <tr key={course.course_id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={removingWaitlistCourses.includes(course.course_id)}
                                onChange={() => handleWaitlistCheckboxChange(course.course_id)}
                              />
                            </td>
                            <td>{course.course_id}</td>
                            <td>{course.name}</td>
                            <td>{course.credits}</td>
                            <td>{course.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Remove selected button */}
                    {removingWaitlistCourses.length > 0 && (
                      <div className="submit-container">
                        <button type="button" onClick={handleRemoveFromWaitlist} className="remove-btn">
                          Remove Selected Courses from Waitlist
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-courses-message">No courses currently in the waitlist.</p>
                )}
              </div>
            )}



          {activeTab === 'current' && (
              <div className="current-registrations">
                <h2>Currently Registered Courses</h2>
                {registeredCourses.length > 0 ? (
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
                      {registeredCourses.map((course) => (
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
                          <td>Registered</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-courses-message">No courses currently registered.</p>
                )}
              </div>
            )}

            {activeTab === 'degreeworks' && (
              <div className="degreeworks-container">
                <h2>Degree Requirements</h2>

                <div className="gpa-display">
                  <strong>{capitalizeName(user?.name || 'Student')} | {user.major_name || 'Major not found'} | GPA: {calculateGPA()}</strong>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {progressPercentage}%
                  </div>
                </div>

                {requiredCourses.length > 0 && (
                  <table className="degreeworks-table">
                    <thead>
                      <tr>
                        <th>Course ID</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requiredCourses.map((course) => (
                        <tr
                          key={course.course_id}
                          className={
                            course.grade && (course.grade === 'A' || course.grade === 'B' || course.grade === 'C')
                              ? 'completed-course-row'
                              : ''
                          }
                        >
                          <td>{course.course_id}</td>
                          <td>{course.name}</td>
                          <td>{course.credits}</td>
                          <td>{course.grade || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {electiveCourses.length > 0 && (
                  <div className="electives-section">
                    <h3>Elective Courses (9 credits required)</h3>
                    <table className="degreeworks-table">
                      <thead>
                        <tr>
                          <th>Course ID</th>
                          <th>Course Name</th>
                          <th>Credits</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {electiveCourses.map((course) => (
                          <tr
                            key={course.course_id}
                            className={
                              course.grade && (course.grade === 'A' || course.grade === 'B' || course.grade === 'C')
                                ? 'completed-course-row'
                                : ''
                            }
                          >
                            <td>{course.course_id}</td>
                            <td>{course.name}</td>
                            <td>{course.credits}</td>
                            <td>{course.grade || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

        </div>
        {activeTab === 'current' && unregisteringCourses.length > 0 && (
          <div className="submit-container">
            <button
              type="button"
              onClick={() => {
                console.log("Unregister button clicked. Selected courses:", unregisteringCourses);
                handleUnregister();
              }}
              className="remove-btn"
            >
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