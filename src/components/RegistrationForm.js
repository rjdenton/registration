import React, { useState } from 'react';

const CourseRegistrationForm = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    courseCode: '',
    semester: '',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic
    console.log('Course Registration Data Submitted: ', formData);
    // Here you could also send this data to your backend to register the student for the course.
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="studentId">Student ID:</label>
        <input
          type="text"
          id="studentId"
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="courseCode">Course Code:</label>
        <input
          type="text"
          id="courseCode"
          name="courseCode"
          value={formData.courseCode}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="semester">Semester:</label>
        <select
          id="semester"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          required
        >
          <option value="">Select Semester</option>
          <option value="Fall">Fall</option>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes">Additional Notes:</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <button type="submit">Register for Course</button>
    </form>
  );
};

export default CourseRegistrationForm;