# Quiz Builder

A small full-stack app for creating quizzes. You give a quiz a title, add as many questions as you need, and pick a type for each one:

- **True / False**: the answer is chosen with radio buttons
- **Short answer**: the answer is a short piece of text
- **Multiple choice**: several options, any number of which can be correct

Quizzes are listed on a dashboard. Each one has its own page with a read-only view of its questions and the correct answers, and you can delete it from the list.

## Stack

| Part     | Tools                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Backend  | Node.js, Express 5, TypeScript, Prisma, SQLite, Zod                                   |
| Frontend | Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS 4, React Hook Form, Zod |
| Tests    | Vitest, Supertest, React Testing Library                                              |
| Tooling  | ESLint 9, Prettier 3                                                                  |

## Getting started

You need Node.js 20 or newer. The database is a local SQLite file, so there is nothing else to install.

```bash
git clone <repo-url> quiz-builder
cd quiz-builder
npm run install:all
```

### 1. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

The defaults work as is. `.env` files are ignored by git.

| File                  | Variable              | Default                 | Purpose                              |
| --------------------- | --------------------- | ----------------------- | ------------------------------------ |
| `backend/.env`        | `PORT`                | `4000`                  | API port                             |
| `backend/.env`        | `DATABASE_URL`        | `file:./dev.db`         | Database connection string           |
| `backend/.env`        | `CORS_ORIGIN`         | `http://localhost:3000` | Frontend URL allowed to call the API |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Where the frontend sends requests    |

### 2. Database

```bash
cd backend
npx prisma migrate dev
```

This creates `backend/prisma/dev.db`, applies the migrations and fills the database with two sample quizzes.

### 3. Run it

Use two terminals:

```bash
cd backend
npm run dev        # API on http://localhost:4000
```

```bash
cd frontend
npm run dev        # app on http://localhost:3000
```

Open http://localhost:3000. You'll land on the quiz list.

## Pages

| Route          | What it does                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `/create`      | Form for a new quiz. Questions can be added and removed, and each has its own type.              |
| `/quizzes`     | All quizzes with their question counts. Click a quiz to open it, or the trash icon to delete it. |
| `/quizzes/:id` | The quiz title and its questions in read-only mode, with correct answers highlighted.            |

## Creating a sample quiz

There are three ways.

**Seed script.** From `backend/`, run `npm run db:seed`. It replaces everything in the database with two quizzes: "JavaScript Fundamentals", which has one question of each type, and "Web Basics".

**Through the app.** Go to http://localhost:3000/create, enter a title, fill in the questions and click **Create quiz**. After saving you're taken to the new quiz's page.

**Through the API.**

```bash
curl -X POST http://localhost:4000/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Geography",
    "questions": [
      { "type": "BOOLEAN", "text": "The Nile is in Africa.", "correctAnswer": true },
      { "type": "INPUT", "text": "Capital of Ukraine?", "correctAnswer": "Kyiv" },
      {
        "type": "CHECKBOX",
        "text": "Which of these are oceans?",
        "options": [
          { "text": "Pacific", "isCorrect": true },
          { "text": "Sahara", "isCorrect": false },
          { "text": "Atlantic", "isCorrect": true }
        ]
      }
    ]
  }'
```

## API

Base URL: `http://localhost:4000`

| Method   | Path           | Response                                                                              |
| -------- | -------------- | ------------------------------------------------------------------------------------- |
| `POST`   | `/quizzes`     | `201` with the created quiz                                                           |
| `GET`    | `/quizzes`     | `200` with `id`, `title`, `questionCount` and `createdAt` for each quiz, newest first |
| `GET`    | `/quizzes/:id` | `200` with the quiz, its questions and their answers                                  |
| `DELETE` | `/quizzes/:id` | `204` with an empty body                                                              |

Errors always come back in the same shape:

```json
{
  "message": "Validation failed",
  "errors": [{ "path": "questions.0.options", "message": "Mark at least one option as correct" }]
}
```

The API returns `400` for an invalid body or id, `404` when the quiz doesn't exist, and `500` for anything unexpected. A `500` never includes internal details.

A quiz is valid when:

- the title is 1 to 200 characters long
- it has between 1 and 50 questions, and every question has text
- a True / False question has a `true` or `false` answer
- a short answer question has a non-empty answer
- a multiple choice question has 2 to 10 options with text, and at least one of them is marked correct

## Database

The schema is in `backend/prisma/schema.prisma` and has three tables:

- `Quiz`: the title and timestamps
- `Question`: type, text and position. True / False answers go in `booleanAnswer`, short answers in `textAnswer`.
- `QuestionOption`: the options of a multiple choice question, with an `isCorrect` flag

Deleting a quiz also deletes its questions and options.

Commands you can run from `backend/`:

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run db:migrate` | Apply new migrations                           |
| `npm run db:seed`    | Replace all data with the sample quizzes       |
| `npm run db:reset`   | Recreate the database from scratch and seed it |
| `npm run db:studio`  | Open Prisma Studio to browse the data          |

### Switching to PostgreSQL

1. In `schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` in `backend/.env`, for example `postgresql://postgres:postgres@localhost:5432/quiz_builder`.
3. Delete the `prisma/migrations` folder and run `npx prisma migrate dev --name init`.

## Tests

```bash
npm test
```

This runs both test suites from the repo root. To run one app's tests, use `npm test` inside `backend/` or `frontend/`. Inside either folder, `npm run test:coverage` also prints a coverage report.

The backend tests send real HTTP requests to the Express app. They use a separate SQLite database that is created before the run and deleted afterwards, so your development data stays untouched. They check every endpoint, the validation rules for each question type and the error responses.

The frontend tests render components and pages in jsdom, with the API mocked. They cover the quiz form (validation, adding and removing questions and options, changing a question's type, submitting), the list, detail and create pages, the API client and the data-loading hook.

## Code quality

From the repo root:

```bash
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run format         # Prettier, rewrites files
npm run format:check   # Prettier, only reports
```

## Project structure

```
quiz-builder/
├── backend/
│   ├── prisma/          schema, migrations, seed script
│   ├── src/
│   │   ├── config/      environment variables, checked at startup
│   │   ├── routes/      URL to controller mapping
│   │   ├── controllers/ read the request, call a service, send the response
│   │   ├── services/    database queries and response mapping
│   │   ├── validation/  Zod schemas for request bodies and params
│   │   ├── middleware/  404 and error handling
│   │   └── lib/         Prisma client, HTTP error classes
│   └── tests/
├── frontend/
│   ├── pages/           /create, /quizzes, /quizzes/[id]
│   ├── components/      layout, quiz form, list item, question preview
│   ├── services/        API client
│   ├── hooks/           data loading with request cancellation
│   ├── lib/             form schema and form-to-request mapping
│   ├── types/           shared types
│   ├── styles/          Tailwind setup
│   └── tests/
└── README.md
```

## Design decisions

- **Each answer type has its own column or table.** I didn't store answers as a JSON blob, so the database itself guarantees the shape of the data. The API turns rows back into a typed object based on the question's `type`.
- **Validation on both sides.** The server validates every request with Zod, and the form uses its own Zod schema so the user sees errors before anything is sent.
- **Switching a question's type keeps your input.** The form keeps answer fields for every type, and only the ones for the selected type are validated and sent.
- **Deleting asks for confirmation.** Deleting a quiz can't be undone, so the trash icon asks before removing it.
