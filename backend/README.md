# Backend

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
