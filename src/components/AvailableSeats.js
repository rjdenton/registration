import React, { useEffect, useState } from 'react';

const AvailableSeats = ({ courseId }) => {
    const [availableSeats, setAvailableSeats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAvailableSeats = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/available_seats?course_id=${courseId}`);
                if (!response.ok) {
                    throw new Error('Error fetching seat availability');
                }
                const data = await response.json();
                setAvailableSeats(data.available_seats);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailableSeats();
    }, [courseId]);

    if (loading) return <div>Loading seat availability...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <p>Available Seats: {availableSeats !== null ? availableSeats : 'N/A'}</p>
        </div>
    );
};

export default AvailableSeats;
