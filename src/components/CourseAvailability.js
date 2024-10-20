import React, { useEffect, useState } from 'react';

const CourseAvailability = ({ courseId }) => {
    const [availability, setAvailability] = useState({
        seatsAvailable: 0,
        waitlistSeats: 0,
    });

    const fetchCourseAvailability = async () => {
        try {
            const response = await fetch(`/course_availability/${courseId}`);
            if (!response.ok) {
                throw new Error('Error fetching course availability');
            }
            const data = await response.json();
            setAvailability(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchCourseAvailability(); // Initial fetch

        // Set up polling to check availability every 5 seconds
        const intervalId = setInterval(() => {
            fetchCourseAvailability();
        }, 5000);

        // Clear the interval on component unmount
        return () => clearInterval(intervalId);
    }, [courseId]);

    return (
        <div>
            <h3>Course Availability</h3>
            <p>Seats Available: {availability.seats_available}</p>
            <p>Waitlist Seats: {availability.waitlist_seats}</p>
        </div>
    );
};

export default CourseAvailability;
