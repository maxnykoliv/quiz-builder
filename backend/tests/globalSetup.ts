import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const TEST_DB_URL = 'file:./test.db';
const testDbFiles = ['test.db', 'test.db-journal'].map((file) =>
  path.resolve(__dirname, '../prisma', file),
);

function removeTestDb() {
  testDbFiles.forEach((file) => rmSync(file, { force: true }));
}

export function setup() {
  removeTestDb();
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'ignore',
  });
}

export function teardown() {
  removeTestDb();
}
