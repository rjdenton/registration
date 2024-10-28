import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file (only in local development)
load_dotenv()

def create_connection():
    try:
        # If running on Heroku, DATABASE_URL is set, so we parse it
        db_url = os.getenv('JAWSDB_URL') or os.getenv('DATABASE_URL')

        if db_url:
            # Parse the Heroku JawsDB URL
            url = urlparse(db_url)
            host = url.hostname
            user = url.username
            password = url.password
            database = url.path[1:]  # Remove the leading "/"
        else:
            # Local development (using .env variables)
            host = os.getenv("DB_HOST")
            user = os.getenv("DB_USER")
            password = os.getenv("DB_PASSWORD")
            database = os.getenv("DB_NAME")

        # Establish the database connection
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )

        if connection.is_connected():
            print("Connection to the database was successful.")
            return connection

    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return None

def close_connection(connection):
    if connection.is_connected():
        connection.close()
        print("Database connection closed.")

# Function to verify login credentials (no hashing for testing)
def verify_login(email, password):
    connection = create_connection()
    if connection is None:
        return None  # Return None if there's a connection error

    try:
        cursor = connection.cursor(dictionary=True)
        # Query to select the user by email and password (not secure, for testing only)
        query = "SELECT email, name, student_id, major_id FROM students WHERE email = %s AND password = %s"
        cursor.execute(query, (email, password))  # Use plain password for testing
        result = cursor.fetchone()

        return result  # Return user info if found; None otherwise

    except Error as e:
        print(f"Error querying the database: {e}")
        return None

    finally:
        close_connection(connection)


def get_recommendations(student_id, major_id):
    connection = create_connection()
    if connection is None:
        return None  # Return None if there's a connection error

    try:
        cursor = connection.cursor(dictionary=True)

        # Fetch courses for the major using major_id
        query_courses = """
            SELECT * FROM courses WHERE major_id = %s
        """
        cursor.execute(query_courses, (major_id,))
        courses = cursor.fetchall()
        print("Courses for Major:", courses)  # Debug print

        # Fetch completed courses for the student
        query_completed_courses = """
            SELECT course_id FROM completed WHERE student_id = %s
        """
        cursor.execute(query_completed_courses, (student_id,))
        completed_courses = {row['course_id'] for row in cursor.fetchall()}
        print("Completed Courses:", completed_courses)  # Debug print

        # Filter courses based on prerequisites and exclude completed courses
        recommended_courses = []
        for course in courses:
            if course['course_id'] in completed_courses:
                continue  # Skip courses that the student has already completed

            prerequisites_str = course['prerequisites']
            if not prerequisites_str or prerequisites_str.lower() == 'null':  # Handle null or empty prerequisites
                recommended_courses.append(course)
            else:
                # Check if prerequisites are met
                try:
                    prerequisites = [int(p) for p in prerequisites_str.split(',')]
                    print(f"Course: {course['course_id']}, Prerequisites: {prerequisites}")  # Debug print
                    if all(prerequisite in completed_courses for prerequisite in prerequisites):
                        recommended_courses.append(course)
                except ValueError:
                    print(f"Invalid prerequisite value for course {course['course_id']}: {prerequisites_str}")

        print("Recommended Courses:", recommended_courses)  # Debug print
        return recommended_courses

    except Error as e:
        print(f"Error querying the database: {e}")
        return None

    finally:
        close_connection(connection)



# Add this function to db.py
def get_major_id_by_name(major_name):
    connection = create_connection()
    if connection is None:
        return None  # Return None if there's a connection error

    try:
        cursor = connection.cursor(dictionary=True)

        # Query to select the major ID based on major_name
        query = "SELECT major_id FROM majors WHERE major_name = %s"
        cursor.execute(query, (major_name,))
        result = cursor.fetchone()

        if result:
            return result['major_id']  # Return the major_id if found
        else:
            return None  # Return None if major is not found

    except Error as e:
        print(f"Error querying the database: {e}")
        return None

    finally:
        close_connection(connection)


