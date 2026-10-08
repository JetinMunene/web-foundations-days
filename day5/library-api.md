# Library Books REST API

## Overview

This REST API manages books in a library system. The main resource is `books`.

Base URL:

```text
https://api.example.com

API Endpoints
1. List All Books
- Method: GET
- Path: /books
- Description: Returns a list of all books in the library.
- Success Status: 200 OK

Get One Book
- Method: GET
- Path: /books/:id
- Description: Returns a single book using its unique ID.
- Success Status: 200 OK

Create a Book
- Method: POST
- Path: /books
- Description: Creates a new book in the library.
- Success Status: 201 Created

Update a Book
- Method: PUT
- Path: /books/:id
- Description: Updates an existing book using its ID.
- Success Status: 200 OK

Delete a Book
- Method: DELETE
- Path: /books/:id
- Description: Deletes a book using its unique ID.
- Success Status: 204 No Content

List Books by Author
- Method: GET
- Path: /books?author=Robert%20C.%20Martin
- Description: Returns books that match the supplied author query parameter.
- Success Status: 200 OK

Error Responses
400 Bad Request
A 400 Bad Request response is returned when the client sends invalid or incomplete data.
For example, a client tries to create a book without providing the required title.

404 Not Found
A 404 Not Found response is returned when the requested book does not exist.
eg GET /books/99999

Endpoint Summary
| Operation | Method | Path | Success Status |
|---|---|---|---|
| List all books | GET | `/books` | 200 OK |
| Get one book | GET | `/books/:id` | 200 OK |
| Create a book | POST | `/books` | 201 Created |
| Update a book | PUT | `/books/:id` | 200 OK |
| Delete a book | DELETE | `/books/:id` | 204 No Content |
| List books by author | GET | `/books?author=...` | 200 OK |
