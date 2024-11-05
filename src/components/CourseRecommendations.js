import React, { useEffect, useState } from 'react';

const CourseRecommendations = ({ studentId, majorName }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch(`https://mmis6299-registration-3fe6af6fc84a.herokuapp.com/api/recommendations?student_id=${studentId}&name=${majorName}`);

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                if (data && Array.isArray(data)) {
                    setCourses(data);
                } else {
                    throw new Error('Invalid data format received');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [studentId, majorName]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Recommended Courses</h2>
            {courses.length > 0 ? (
                <ul>
                    {courses.map(course => (
                        <li key={course.course_id}>{course.name} (Credits: {course.credits})</li>
                    ))}
                </ul>
            ) : (
                <div>No recommendations available</div>
            )}
        </div>
    );
};

export default CourseRecommendations;

