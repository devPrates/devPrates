import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

if (existsSync('.env')) process.loadEnvFile('.env')

// Migrations usam a conexão direta (sem pooler).
export default defineConfig({
  dialect: 'postgresql',
  schema: './app/lib/db/schema.ts',
  out: './drizzle',
  schemaFilter: ['finance'],
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? '' },
})
