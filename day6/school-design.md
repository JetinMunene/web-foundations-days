# School Database Design

## Overview

This database is designed to manage students, courses and student enrolments. It uses three tables: `students`, `courses` and `enrolments`.

---

## Students Table

The `students` table stores information about students.

It contains:

- `id` - the unique identifier for each student.
- `name` - the student's name.
- `email` - the student's email address.

The `id` is the primary key, while `email` is unique so that two students cannot use the same email address.

---

## Courses Table

The `courses` table stores information about courses offered by the school.

It contains:

- `id` - the unique identifier for each course.
- `name` - the name of the course.
- `description` - a short description of the course.

The `id` is the primary key.

---

## Enrolments Table

The `enrolments` table records which students are enrolled in which courses.

It contains:

- `id` - the unique identifier for each enrolment.
- `student_id` - a foreign key referring to a student.
- `course_id` - a foreign key referring to a course.
- `grade` - the student's grade for the course.

The `student_id` and `course_id` columns are foreign keys that connect the enrolments table to the students and courses tables.

The combination of `student_id` and `course_id` is UNIQUE. This prevents the same student from enrolling in the same course more than once.

---

## Relationships

There is a one-to-many relationship between students and enrolments. One student can have many enrolment records, while each enrolment belongs to one student.

There is also a one-to-many relationship between courses and enrolments. One course can have many enrolment records, while each enrolment belongs to one course.

Students and courses have a many-to-many relationship because one student can take many courses, and one course can have many students.

The `enrolments` table is needed as a join table to represent this many-to-many relationship. Each row in the enrolments table represents one student being enrolled in one course. It also allows us to store additional information about that relationship, such as the student's grade.

---

## Index

I would add an index on `enrolments.student_id`.

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);

The primary key already makes lookups by student fast (student_id
comes first). Teachers will often ask "who is on my course?", which
searches by course_id, so a separate index on course_id speeds up
that query.

## SQL or NoSQL?
 
I would choose SQL for this school system because the data has clear relationships between students, courses and enrolments. Students and courses have a many-to-many relationship that is naturally represented using a relational join table. SQL also provides primary keys, foreign keys, unique constraints and other rules that help maintain data integrity. Queries using JOIN, GROUP BY and LEFT JOIN make it easy to retrieve information such as courses taken by a student and the number of students in each course. NoSQL could be useful for systems with highly flexible or rapidly changing data structures, but a relational SQL database is a better fit for this structured school system.