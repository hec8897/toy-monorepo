# Backend Application

NestJS backend application with PostgreSQL (Supabase) integration.

## Database Setup

This application uses PostgreSQL via Supabase with TypeORM.

### Getting Your Supabase Connection Details

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Under **Connection Info**, you'll find:
   - Host: `db.<your-project-ref>.supabase.co`
   - Port: `5432`
   - Database name: `postgres`
   - Username: `postgres`
   - Password: (the password you set during project creation)

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```env
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-password
   DB_DATABASE=postgres
   DB_SSL=true
   ```

### Running the Application

```bash
# Development
npm run dev:backend

# The API will be available at http://localhost:3001/api
```

### Database Entities

The application includes an example `User` entity located at `src/entities/user.entity.ts`.

TypeORM will automatically sync the database schema in development mode (`synchronize: true`).

**Warning**: Disable `synchronize` in production and use migrations instead.

## Project Structure

```
apps/backend/
├── src/
│   ├── app/              # Main application module
│   ├── config/           # Configuration files
│   ├── entities/         # TypeORM entities
│   └── main.ts          # Application entry point
├── .env                  # Environment variables (not in git)
├── .env.example         # Example environment variables
└── README.md            # This file
```
