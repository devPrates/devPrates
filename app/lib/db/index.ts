// Só roda no servidor: usa DATABASE_URL.
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

function connect() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não está configurada.')
  return drizzle(new Pool({ connectionString: url }), { schema })
}

let db: ReturnType<typeof connect> | undefined

// Conecta só no primeiro uso, para o build não depender do banco. Usa Pool
// (WebSocket) porque o driver HTTP do Neon não faz transação interativa.
export function getDb() {
  return (db ??= connect())
}
