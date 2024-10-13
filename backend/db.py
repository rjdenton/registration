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
