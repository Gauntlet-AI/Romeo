# Romeo API Server

An Express.js API server for the Romeo reservation system.

## Features

- User account creation with JWT authentication
- Reservable management with hierarchical collections
- Constraint definition for reservables
- Dynamic validator creation using LLM to generate PostgreSQL functions
- Reservation creation with validation through PostgreSQL stored procedures

## Tech Stack

- Node.js / Express.js
- PostgreSQL database
- Sequelize ORM
- JWT for authentication
- Docker for containerization

## Prerequisites

- Node.js 16+
- Docker and Docker Compose for the database

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-dir>/SERVER
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the `SERVER` directory with the following variables:

```
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=romeo
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=development
```

### 4. Start the Database

From the root directory:

```bash
docker-compose up -d
```

This will start the PostgreSQL database container.

### 5. Start the Server

```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your .env file).

## API Endpoints

### Users

- `POST /api/users`: Create a new user account
- `GET /api/users/profile`: Get the current user's profile (requires authentication)

### Reservables

- `POST /api/reservables`: Create a new reservable
- `GET /api/reservables/user`: Get all reservables for the authenticated user
- `GET /api/reservables/:id`: Get a single reservable by ID
- `PUT /api/reservables/:id`: Update a reservable
- `DELETE /api/reservables/:id`: Delete a reservable
- `POST /api/reservables/collection`: Add a reservable to a collection
- `DELETE /api/reservables/collection/:parent_id/:child_id`: Remove a reservable from a collection
- `GET /api/reservables/:id/children`: Get all children of a reservable

### Constraints

- `POST /api/constraints`: Create a new constraint
- `GET /api/constraints/reservable/:reservable_id`: Get all constraints for a reservable
- `GET /api/constraints/:id`: Get a single constraint by ID
- `PUT /api/constraints/:id`: Update a constraint
- `DELETE /api/constraints/:id`: Delete a constraint

### Validators

- `POST /api/validators`: Create a new validator
- `GET /api/validators/reservable/:reservable_id`: Get all validators for a reservable
- `GET /api/validators/:id`: Get a single validator by ID
- `PATCH /api/validators/:id/status`: Toggle validator status (activate/deactivate)
- `DELETE /api/validators/:id`: Delete a validator

### Reservations

- `POST /api/reservations`: Create a new reservation
- `GET /api/reservations/reservable/:reservable_id`: Get all reservations for a reservable
- `GET /api/reservations/user/:user_id`: Get all reservations for a user
- `GET /api/reservations/:id`: Get a single reservation by ID

## Authentication

To access protected endpoints, include a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

You can obtain a token by creating a user account.

## License

This project is licensed under the MIT License. 