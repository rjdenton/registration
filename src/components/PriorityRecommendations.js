// PriorityRecommendations.js

import React, { useEffect, useState } from 'react';

function PriorityRecommendations({ courses }) {
    const [priorityList, setPriorityList] = useState([]);

    useEffect(() => {
        if (courses) {
            const result = calculatePriority(courses);
            setPriorityList(result);
        }
    }, [courses]);

    // Function to calculate the priority of courses
    function calculatePriority(courseData) {
        // Step 1: Build a map of courses to prerequisites
        const courseMap = new Map();

        courseData.forEach(course => {
            const prerequisites = course.prerequisites
                ? course.prerequisites.split(',').map(id => parseInt(id.trim()))
                : []; // Parse prerequisites if present, otherwise empty array
            courseMap.set(course.course_id, { ...course, prerequisites, priority: 0 });
        });

        // Step 2: Calculate priority by counting dependencies
        function getPriority(course_id) {
            const course = courseMap.get(course_id);
            if (course.priority > 0) return course.priority; // Use memoized priority if already calculated

            let priorityCount = 0;
            course.prerequisites.forEach(prereqId => {
                priorityCount = Math.max(priorityCount, 1 + getPriority(prereqId));
            });

            course.priority = priorityCount; // Memoize result
            return course.priority;
        }

        // Calculate priority for each course
        courseData.forEach(course => getPriority(course.course_id));

        // Step 3: Sort courses by highest priority first
        return courseData
            .sort((a, b) => courseMap.get(b.course_id).priority - courseMap.get(a.course_id).priority)
            .map(course => course.course_id); // Only return course IDs in order
    }

    return (
        <div>
            <h3>Priority Course Recommendations</h3>
            <ul>
                {priorityList.map((courseId) => (
                    <li key={courseId}>Course ID: {courseId}</li>
                ))}
            </ul>
        </div>
    );
}

export default PriorityRecommendations;
