# Backend

## Project structure

[Prisma](https://www.prisma.io/docs/orm) files:

- `prisma/migrations/`: Database migration files.
- `prisma/schema.prisma`: Database schema.
- `lib/prisma.ts`: ORM client for interacting with the Database. Reads the Database credentials from the `.env`.
- `prisma.config.ts`: Reads the Database credentials from the `.env` and turns them into a Database connection string.

## Making it work

Copy `.env.example` into `.env` and edit it.

Delete any previous database docker volume if necessary:

```sh
docker volume rm backend_mssql_data
```

Start the MSSQL instance locally via docker compose:

```sh
docker compose up -d
```

Make the database migration:

```sh
npx prisma migrate dev --create-only --name migration_name
npx prisma migrate dev
```

Generate the ORM files for the database:

```sh
npx prisma generate
```

Run the client:

```sh
npx tsx src/index.ts
```
