import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Use process.env and provide a dummy fallback for the build phase
    url: process.env.DATABASE_URL || 'postgresql://postgres:dummy@localhost:5432/dummy',
  },
});
