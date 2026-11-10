import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.quiz.deleteMany();

  await prisma.quiz.create({
    data: {
      title: 'JavaScript Fundamentals',
      questions: {
        create: [
          {
            position: 0,
            type: 'BOOLEAN',
            text: 'JavaScript is a statically typed language.',
            booleanAnswer: false,
          },
          {
            position: 1,
            type: 'INPUT',
            text: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
            textAnswer: 'const',
          },
          {
            position: 2,
            type: 'CHECKBOX',
            text: 'Which of the following are primitive types in JavaScript?',
            options: {
              create: [
                { position: 0, text: 'string', isCorrect: true },
                { position: 1, text: 'number', isCorrect: true },
                { position: 2, text: 'object', isCorrect: false },
                { position: 3, text: 'symbol', isCorrect: true },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.quiz.create({
    data: {
      title: 'Web Basics',
      questions: {
        create: [
          {
            position: 0,
            type: 'BOOLEAN',
            text: 'HTTP status 404 means "Not Found".',
            booleanAnswer: true,
          },
          {
            position: 1,
            type: 'CHECKBOX',
            text: 'Which HTTP methods are idempotent?',
            options: {
              create: [
                { position: 0, text: 'GET', isCorrect: true },
                { position: 1, text: 'POST', isCorrect: false },
                { position: 2, text: 'PUT', isCorrect: true },
                { position: 3, text: 'DELETE', isCorrect: true },
              ],
            },
          },
        ],
      },
    },
  });

  console.info('Seeded 2 sample quizzes');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
