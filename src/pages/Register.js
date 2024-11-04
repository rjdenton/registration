import React, { useState, useEffect } from 'react';
import useRegistration from '../components/useRegistration.js'
import { useUser } from '../components/UserContext';
import '../styles/register.css';

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
    completedCourses,
    removingWaitlistCourses,
    handleWaitlistCheckboxChange,
    handleRemoveFromWaitlist,
    waitlistCourses
  } = useRegistration(user);

  // Use useEffect in the component to handle side effects.
  useEffect(() => {
    fetchCurrentRegistrations();
  }, [user, fetchCurrentRegistrations]);

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
                {waitlistCourses.length > 0 ? (
                  <div>
                    <table className="courses-table full-width styled-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Course ID</th>
                          <th>Course Name</th>
                          <th>Credits</th>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
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



          {activeTab === 'completed' && (
              <div className="completed-courses">
                <h2>Completed Courses</h2>
                {completedCourses.length > 0 ? (
                  <table className="courses-table full-width styled-table">
                    <thead>
                      <tr>
                        <th>Course ID</th>
                        <th>Course Name</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedCourses.map((course) => (
                        <tr key={course.course_id}>
                          <td>{course.course_id}</td>
                          <td>{course.name}</td>
                          <td>{course.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-courses-message">No completed courses available.</p>
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
