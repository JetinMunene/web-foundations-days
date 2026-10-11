
-- Remove existing tables so the script can be run again safely.
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;



-- 1. CREATE TABLES

-- Students table
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table
CREATE TABLE courses (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Enrolments table
-- This is the join table between students and courses.
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),

    -- Prevent the same student from enrolling
    -- in the same course more than once.
    UNIQUE (student_id, course_id)
);

-- 2. INSERT SAMPLE DATA

-- Students
INSERT INTO students (id, name, email)
VALUES
    (1, 'Alice Johnson', 'alice@example.com'),
    (2, 'Brian Smith', 'brian@example.com'),
    (3, 'Carol Williams', 'carol@example.com'),
    (4, 'David Brown', 'david@example.com');


-- Courses
INSERT INTO courses (id, name, description)
VALUES
    (1, 'Web Development', 'HTML, CSS and JavaScript'),
    (2, 'Database Systems', 'SQL and relational databases'),
    (3, 'Computer Networks', 'Networking fundamentals');


-- Enrolments
INSERT INTO enrolments (id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, 'A'),
    (5, 3, 2, 'A');


-- 3. REQUIRED QUERIES


-- Query 1:
-- Find all courses for one student by name.


SELECT
    students.name AS student_name,
    courses.name AS course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.id = enrolments.student_id
JOIN courses
    ON courses.id = enrolments.course_id
WHERE students.name = 'Alice Johnson';


-- Query 2:
-- Find all students enrolled on one course.


SELECT
    courses.name AS course_name,
    students.name AS student_name,
    enrolments.grade
FROM courses
JOIN enrolments
    ON courses.id = enrolments.course_id
JOIN students
    ON students.id = enrolments.student_id
WHERE courses.name = 'Web Development';


-- Query 3:
-- Find the number of students per course.
-- GROUP BY is used to count students in each course.

SELECT
    courses.name AS course_name,
    COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments
    ON courses.id = enrolments.course_id
GROUP BY courses.id, courses.name;


-- Query 4:
-- Find students who have no enrolments.
-- LEFT JOIN allows students without matching enrolment records
-- to appear in the results.

SELECT
    students.id,
    students.name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.id = enrolments.student_id
WHERE enrolments.id IS NULL;


-- Query 5:
-- Update one enrolment's grade.
-- Change Alice Johnson's Database Systems grade from B to A.

UPDATE enrolments
SET grade = 'A'
WHERE student_id = 1
  AND course_id = 2;


-- Verify the updated grade.

SELECT
    students.name AS student_name,
    courses.name AS course_name,
    enrolments.grade
FROM enrolments
JOIN students
    ON students.id = enrolments.student_id
JOIN courses
    ON courses.id = enrolments.course_id
WHERE students.name = 'Alice Johnson'
  AND courses.name = 'Database Systems';