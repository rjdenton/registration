import mysql
import os

import socketio
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from mysql.connector import Error
from db import verify_login, create_connection, close_connection, get_recommendations, get_major_id_by_name

app = Flask(__name__, static_folder='../build', template_folder='../build')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists("../build/" + path):
        return send_from_directory('../build', path)
    else:
        return send_from_directory('../build', 'index.html')


@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "https://mmis6299-registration-3fe6af6fc84a.herokuapp.com")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
    return response



@app.route('/api/login', methods=['OPTIONS','POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Verify login credentials and retrieve user info
    user_info = verify_login(email, password)

    if user_info:
        return jsonify({
            "message": "Login successful!",
            "user": {
                "email": user_info['email'],
                "name": user_info['name'],
                "student_id": user_info['student_id'],
                "major_id": user_info['major_id']
            }
        }), 200
    else:
        return jsonify({"message": "Invalid email or password!"}), 401

@app.route('/api/courses', methods=['OPTIONS','GET'])
def get_courses():
    major_id = request.args.get('major_id')  # Get major_id from query parameters
    student_id = request.args.get('student_id')  # Get student_id from query parameters

    if not major_id:
        return jsonify({"message": "Major ID is required!"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"message": "Database connection failed!"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        # Query to select courses based on major_id
        query = """
        SELECT course_id, name, credits FROM courses
        WHERE major_id = %s AND semester_available LIKE %s
        """
        semester = "%Fall%"  # Adjust based on the desired semester
        cursor.execute(query, (major_id, semester))
        courses = cursor.fetchall()

        return jsonify(courses)  # Return the list of courses

    except Error as e:
        print(f"Error querying the database: {e}")
        return jsonify({"message": "Error fetching courses!"}), 500

    finally:
        close_connection(connection)

@app.route('/api/recommendations', methods=['OPTIONS','GET'])
def recommendations():
    major_name = request.args.get('major_name')  # Get the value of major_name
    student_id = request.args.get('student_id')  # Get the value of student_id

    print(f"Received major_name: {major_name}, student_id: {student_id}")  # Log the values

    # Check if either major_name or student_id is missing
    if not major_name or not student_id:
        return jsonify({"error": "Missing student_id or major_name"}), 400

    # Use the db.py function to get the major_id from the major_name
    major_id = get_major_id_by_name(major_name)
    if not major_id:
        return jsonify({"error": f"Major '{major_name}' not found"}), 404

    print(f"Major ID for '{major_name}': {major_id}")

    # Now pass the major_id and student_id to the get_recommendations function
    recommended_courses = get_recommendations(student_id, major_id)

    if recommended_courses is None:
        return jsonify({"error": "Error fetching recommended courses"}), 500

    # Return the recommended courses as a JSON response
    return jsonify(recommended_courses)


@app.route('/api/available_seats', methods=['OPTIONS','GET'])
def get_available_seats():
    course_id = request.args.get('course_id')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Query the available seats for the course
        query = "SELECT course_id, seats_available FROM courses WHERE course_id = %s"
        cursor.execute(query, (course_id,))
        result = cursor.fetchone()

        if result:
            return jsonify(result)
        else:
            return jsonify({"error": "Course not found"}), 404

    except mysql.connector.Error as e:
        print(f"Error executing query: {e}")
        return jsonify({"error": "Failed to execute query"}), 500

    finally:
        cursor.close()
        close_connection(connection)


def emit_seat_update(course_id):
    connection = create_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT course_id, seats_available, waitlist_seats FROM courses WHERE course_id = %s",
            (course_id,)
        )
        result = cursor.fetchone()

        if result:
            print(f"Emitting seat update: {result}")  # Log emitted data
            socketio.emit('seat_update', result)
        else:
            print(f"No data found for course_id: {course_id}")

    except Exception as e:
        print(f"Exception in emit_seat_update: {e}")
    finally:
        close_connection(connection)


@app.route('/api/register_course', methods=['OPTIONS', 'POST'])
def register_course():
    data = request.json
    course_id = data.get('course_id')
    student_id = data.get('student_id')

    if not course_id or not student_id:
        return jsonify({'error': 'Course ID and Student ID are required'}), 400

    try:
        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Failed to connect to the database"}), 500

        cursor = connection.cursor()

        # Lock row for update to prevent race conditions
        cursor.execute("""
            UPDATE courses
            SET seats_available = seats_available - 1
            WHERE course_id = %s AND seats_available > 0
        """, (course_id,))

        # Check if any rows were affected (i.e., seats were available)
        if cursor.rowcount > 0:
            cursor.execute("""
                INSERT INTO registrations (student_id, course_id)
                VALUES (%s, %s)
            """, (student_id, course_id))
            connection.commit()

            # Emit seat update if registration was successful
            emit_seat_update(course_id)
            return jsonify({'message': 'Course registered successfully'}), 200
        else:
            return jsonify({'error': 'No available seats or invalid course'}), 400

    except Exception as e:
        print(f"Exception occurred: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

    finally:
        close_connection(connection)



@app.route('/api/registered_courses', methods=['OPTIONS','GET'])
def get_registered_courses():
    student_id = request.args.get('student_id')

    if not student_id:
        return jsonify({"error": "Student ID is required"}), 400

    try:
        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Failed to connect to the database"}), 500

        cursor = connection.cursor(dictionary=True)

        # Query to fetch registered courses
        query_reg = """
        SELECT c.course_id, c.name, c.credits, r.reg_id
        FROM registrations r
        JOIN courses c ON r.course_id = c.course_id
        WHERE r.student_id = %s
        """
        cursor.execute(query_reg, (student_id,))
        registered_courses = cursor.fetchall()

        # Query to fetch waitlisted courses
        query_waitlist = """
        SELECT c.course_id, c.name, c.credits, w.wait_id
        FROM waitlist w
        JOIN courses c ON w.course_id = c.course_id
        WHERE w.student_id = %s
        """
        cursor.execute(query_waitlist, (student_id,))
        waitlisted_courses = cursor.fetchall()

        # Return both registered and waitlisted courses separately
        return jsonify({
            "registered_courses": registered_courses,
            "waitlisted_courses": waitlisted_courses
        })

    except Error as e:
        print(f"Error querying the database: {e}")
        return jsonify({"error": "Error fetching registered courses!"}), 500

    finally:
        close_connection(connection)



@app.route('/api/unregister_course', methods=['OPTIONS','POST'])
def unregister_course():
    data = request.get_json()
    course_id = data.get('course_id')
    student_id = data.get('student_id')

    # Ensure course_id and student_id are present
    if not course_id or not student_id:
        print("Error: Course ID or Student ID is missing.")
        return jsonify({"error": "Course ID and Student ID are required!"}), 400

    # Establish connection
    connection = create_connection()
    if connection is None:
        print("Error: Database connection failed.")
        return jsonify({"error": "Database connection failed!"}), 500

    try:
        cursor = connection.cursor()

        # Log the input values for debugging
        print(f"Attempting to unregister course {course_id} for student {student_id}.")

        # Increment available seats for the course
        update_query = "UPDATE courses SET seats_available = seats_available + 1 WHERE course_id = %s"
        cursor.execute(update_query, (course_id,))
        if cursor.rowcount == 0:
            print(f"Error: Could not update seats for course {course_id}. It might not exist.")
            return jsonify({"error": "Failed to increment available seats."}), 400

        # Log to confirm the seat update was successful
        print(f"Seats incremented successfully for course {course_id}.")

        # Delete the registration entry
        delete_query = "DELETE FROM registrations WHERE course_id = %s AND student_id = %s"
        cursor.execute(delete_query, (course_id, student_id))

        # Check if any row was deleted
        if cursor.rowcount == 0:
            print(f"Error: No registration found for course {course_id} and student {student_id}.")
            return jsonify({"error": "Failed to unregister course. Registration not found."}), 404

        # Commit changes to the database
        connection.commit()
        emit_seat_update(course_id)
        print(f"Successfully unregistered course {course_id} for student {student_id}.")

        return jsonify({"message": f"Unregistered course {course_id} for student {student_id} and increased seat count."}), 200

    except Error as e:
        print(f"Error updating seats or deleting registration: {e}")
        return jsonify({"error": "Error updating seats or deleting registration!"}), 500

    finally:
        close_connection(connection)

@app.route('/api/waitlist_course', methods=['OPTIONS','POST'])
def waitlist_course():
    data = request.get_json()
    course_id = data.get('course_id')
    student_id = data.get('student_id')

    if not course_id or not student_id:
        return jsonify({"error": "Course ID and Student ID are required!"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed!"}), 500

    try:
        cursor = connection.cursor()

        # Insert the student into the waitlist table with created_at timestamp
        insert_query = """
            INSERT INTO waitlist (student_id, course_id, created_at)
            VALUES (%s, %s, NOW())
        """
        cursor.execute(insert_query, (student_id, course_id))

        # Decrement the waitlist seats for the course by 1
        update_waitlist_seats_query = """
            UPDATE courses
            SET waitlist_seats = waitlist_seats - 1
            WHERE course_id = %s AND waitlist_seats > 0
        """
        cursor.execute(update_waitlist_seats_query, (course_id,))

        # Commit the transaction to apply changes
        connection.commit()
        emit_seat_update(course_id)
        print(f"Student {student_id} successfully added to the waitlist for course {course_id} and waitlist seats decremented.")

        return jsonify({"message": "Successfully added to waitlist."}), 200

    except Error as e:
        print(f"Error adding to waitlist: {e}")
        return jsonify({"error": "Error adding to waitlist!"}), 500

    finally:
        close_connection(connection)


@app.route('/api/completed_courses', methods=['OPTIONS','GET'])
def get_completed_courses():
    student_id = request.args.get('student_id')

    if not student_id:
        return jsonify({"error": "Student ID is required"}), 400

    connection = create_connection()
    if connection is None:
        print("Database connection failed.")
        return jsonify({"error": "Failed to connect to the database"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Log the student ID being used for the query
        print(f"Fetching completed courses for student_id: {student_id}")

        # Query to fetch completed courses with course details and grade
        query_completed = """
        SELECT c.course_id, c.name, comp.grade
        FROM completed comp
        JOIN courses c ON comp.course_id = c.course_id
        WHERE comp.student_id = %s
        """
        cursor.execute(query_completed, (student_id,))
        completed_courses = cursor.fetchall()

        # Log the fetched data
        print(f"Fetched completed courses: {completed_courses}")

        return jsonify(completed_courses)

    except Error as e:
        print(f"Error querying the database: {e}")
        return jsonify({"error": "Error fetching completed courses!"}), 500

    finally:
        close_connection(connection)

@app.route('/api/remove_waitlist_course', methods=['OPTIONS','POST'])
def remove_waitlist_course():
    data = request.get_json()
    course_id = data.get('course_id')
    student_id = data.get('student_id')

    if not course_id or not student_id:
        return jsonify({"error": "Course ID and Student ID are required!"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Database connection failed!"}), 500

    try:
        cursor = connection.cursor()

        # Delete the waitlist entry for the student and course
        delete_query = "DELETE FROM waitlist WHERE course_id = %s AND student_id = %s"
        cursor.execute(delete_query, (course_id, student_id))

        # Increment the waitlist seats for the course by 1
        update_waitlist_seats_query = """
            UPDATE courses
            SET waitlist_seats = waitlist_seats + 1
            WHERE course_id = %s
        """
        cursor.execute(update_waitlist_seats_query, (course_id,))

        # Commit changes to the database
        connection.commit()

        emit_seat_update(course_id)

        print(f"Successfully removed course {course_id} from waitlist for student {student_id} and incremented waitlist seats.")
        return jsonify({"message": "Successfully removed from waitlist."}), 200

    except Error as e:
        print(f"Error removing course from waitlist: {e}")
        return jsonify({"error": "Error removing course from waitlist!"}), 500

    finally:
        close_connection(connection)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))


