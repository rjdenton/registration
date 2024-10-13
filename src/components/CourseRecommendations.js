/*
Course Recommendation Outline
Objective: To recommend courses to students based on their major, past courses, and upcoming semester
Tables:
Students
    -id (PK)
    -name
    -email
    -major_id   (FK)

Majors
    -id (PK)
    -name
    -department_id (FK)

Departments
    -id (PK)
    -name

Courses
    -id (PK)
    -name
    -credits
    -description
    -major_id (FK)
    -semester_available (Fall, Spring, Summer)
    -prerequisites

Enrollment
    -id (PK)
    -student_id (FK)
    -course_id (FK)
    -semester (Fall, Spring, Summer)
    -grade (A, B, C, D, F)

Algorithm:
    Input: Student ID to fetch student's major and past courses
    Output: List of recommended courses based on prerequisites taken and if classes are available in the upcoming semester
    Steps:
        1. Fetch student's major and past courses
        2. Query database for courses in student's major
        3. Filter courses based on prerequisites taken by student
        4. Filter courses based on upcoming semester
        5. Return list of recommended courses
*/
