import { useState } from 'react';
import { useCallback } from 'react';

function useRegistration(user) {
  const [activeTab, setActiveTab] = useState('current'); // Track active tab
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]); // All available courses
  const [selectedCourses, setSelectedCourses] = useState([]); // Tracks selected courses
  const [registeredCourses, setRegisteredCourses] = useState([]); // Registered courses
  const [unregisteringCourses, setUnregisteringCourses] = useState([]); // Tracks courses being unregistered
  const [currentRegistrations, setCurrentRegistrations] = useState([]); // Currently registered courses
  const [waitlistCourses, setWaitlistCourses] = useState([]); // Waitlisted courses
  const [completedCourses, setCompletedCourses] = useState([]);
  const [removingWaitlistCourses, setRemovingWaitlistCourses] = useState([]);



    const handleMajorChange = (e) => {
    setMajor(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
  };

  // Fetch registered courses
    const fetchCurrentRegistrations = useCallback(async () => {
      if (user?.student_id) {
        try {
          const response = await fetch(`https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/registered_courses?student_id=${user.student_id}`);
          if (response.ok) {
            const data = await response.json();
            setRegisteredCourses(data.registered_courses);
            setWaitlistCourses(data.waitlisted_courses);
          } else {
            console.error('Error fetching current registrations:', response.statusText);
          }
        } catch (error) {
          console.error('Error during fetchCurrentRegistrations:', error);
        }
      }
    }, [user]);

const fetchCompletedCourses = async () => {
  if (user?.student_id) {
    try {
      console.log("Fetching completed courses for student:", user.student_id);

      const response = await fetch(`https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/completed_courses?student_id=${user.student_id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched completed courses data:", data);
        setCompletedCourses(data);
      } else {
        console.error('Error fetching completed courses:', response.statusText);
      }
    } catch (error) {
      console.error('Error during fetchCompletedCourses:', error);
    }
  }
};

  const handleTabChange = (tab) => {
  setActiveTab(tab);
  if (tab === 'current' && user?.student_id) {
    fetchCurrentRegistrations();
  } else if (tab === 'available' && user?.student_id) {
    handleSubmit({ preventDefault: () => {} });
  } else if (tab === 'completed' && user?.student_id) {
    fetchCompletedCourses();
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!major || !user?.student_id) return;

    const encodedMajor = encodeURIComponent(major);
    const apiUrl = `https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/recommendations?major_name=${encodedMajor}&student_id=${user.student_id}`;

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        let data = await response.json();
        data = data.filter((course) => !currentRegistrations.some((reg) => reg.course_id === course.course_id));
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching recommended courses:', error);
    }
  };

  const handleCheckboxChange = (courseId) => {
    setSelectedCourses((prevSelected) =>
      prevSelected.includes(courseId)
        ? prevSelected.filter((id) => id !== courseId)
        : [...prevSelected, courseId]
    );
  };

const handleWaitlistCheckboxChange = (courseId) => {
  setRemovingWaitlistCourses((prevSelected) =>
    prevSelected.includes(courseId)
      ? prevSelected.filter((id) => id !== courseId)
      : [...prevSelected, courseId]
  );
};

const handleRemoveFromWaitlist = async () => {
  if (removingWaitlistCourses.length === 0) {
    console.log("No courses selected to remove from the waitlist.");
    return;
  }

  for (let courseId of removingWaitlistCourses) {
    try {
      const response = await fetch('https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/remove_waitlist_course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          student_id: user.student_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to remove course ${courseId} from waitlist: ${errorData.error}`);
        alert(`Could not remove course from waitlist: ${errorData.error}`);
        continue;
      }

      console.log(`Successfully removed course ${courseId} from waitlist.`);
    } catch (error) {
      console.error(`Error removing course ${courseId} from waitlist:`, error);
    }
  }

  // Refresh waitlist courses after removal
  await fetchCurrentRegistrations();

  // Clear the removingWaitlistCourses state
  setRemovingWaitlistCourses([]);
};



  const handleRegister = async () => {
  // Filter the selected courses
  const selected = courses.filter((course) => selectedCourses.includes(course.course_id));

  for (let course of selected) {
    try {
      if (course.seats_available > 0) {
        // Register directly if seats are available
        const response = await fetch('https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/register_course', {
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
          console.error('Error registering course:', data.error);
          alert(`Could not register for ${course.name}: ${data.error}`);
          continue;
        }

        console.log(`Successfully registered for course ${course.course_id}.`);
      } else {
        // If no seats are available, add to the waitlist
        const waitlistResponse = await fetch('https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/waitlist_course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: course.course_id,
            student_id: user.student_id,
          }),
        });

        if (!waitlistResponse.ok) {
          const data = await waitlistResponse.json();
          console.error('Error adding to waitlist:', data.error);
          alert(`Could not add to waitlist for ${course.name}: ${data.error}`);
          continue;
        }

        console.log(`Successfully added to waitlist for course ${course.course_id}.`);
      }

      // Update the registered and available courses list
      setRegisteredCourses((prevRegistered) => [
        ...prevRegistered,
        {
          ...course,
          status: course.seats_available > 0 ? 'Registered' : 'Waitlist',
        },
      ]);

      // Remove the course from the available courses list after selection
      setCourses((prevCourses) =>
        prevCourses.filter((prevCourse) => prevCourse.course_id !== course.course_id)
      );

    } catch (error) {
      console.error('Error processing course:', error);
    }
  }

  // Clear selected courses after processing
  setSelectedCourses([]);
  // Refresh the registrations to reflect changes
  fetchCurrentRegistrations();
};


  const handleUnregisterCheckboxChange = (courseId) => {
  setUnregisteringCourses((prevUnregisteringCourses) => {
    let updatedUnregisteringCourses;
    if (prevUnregisteringCourses.includes(courseId)) {
      // If the course is already selected, remove it from the list
      updatedUnregisteringCourses = prevUnregisteringCourses.filter((id) => id !== courseId);
    } else {
      // Otherwise, add it to the list
      updatedUnregisteringCourses = [...prevUnregisteringCourses, courseId];
    }

    console.log(`Updated unregisteringCourses after selection change: ${updatedUnregisteringCourses}`);
    return updatedUnregisteringCourses;
  });
};



  const handleUnregister = async () => {
  if (unregisteringCourses.length === 0) {
    console.log("No courses selected to unregister.");
    return;
  }

  // Ensure you have the latest registeredCourses
  await fetchCurrentRegistrations();

  const unregisteredCourses = registeredCourses.filter(
    (course) => unregisteringCourses.includes(course.course_id)
  );

  console.log("Filtered courses to unregister:", unregisteredCourses);

  if (unregisteredCourses.length === 0) {
    console.log("No matching courses found in registeredCourses to unregister.");
    return;
  }

  for (let course of unregisteredCourses) {
    console.log(`Attempting to unregister course ${course.course_id} for student ${user.student_id}...`);

    try {
      // Make the API request to unregister the course
      const response = await fetch('https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/unregister_course', {
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
        const errorData = await response.json();
        console.error(`Failed to unregister course ${course.course_id}: ${errorData.error}`);
        alert(`Could not unregister course ${course.course_id}: ${errorData.error}`);
        return;
      }

      console.log(`Successfully unregistered course ${course.course_id}.`);

      // Add the unregistered course back to available courses and increment seats
      setCourses((prevCourses) => [
        ...prevCourses,
        { ...course, seats_available: course.seats_available + 1 },
      ]);
    } catch (error) {
      console.error(`Error during API request to unregister course ${course.course_id}:`, error);
    }
  }

  // Clear unregistering courses list after processing
  setUnregisteringCourses([]);
  console.log("Cleared unregistering courses state after processing.");

  // Refresh the registered courses after unregistration has completed
  await fetchCurrentRegistrations();
};

  return {
    major,
    setMajor,
    semester,
    setSemester,
    courses,
    setCourses,
    selectedCourses,
    setSelectedCourses,
    registeredCourses,
    setRegisteredCourses,
    unregisteringCourses,
    setUnregisteringCourses,
    currentRegistrations,
    setCurrentRegistrations,
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
    fetchCompletedCourses,
    waitlistCourses,
    setWaitlistCourses,
    removingWaitlistCourses,
    handleWaitlistCheckboxChange,
    handleRemoveFromWaitlist
  };
}

export default useRegistration;
