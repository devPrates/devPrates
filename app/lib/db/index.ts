// Só roda no servidor: usa DATABASE_URL.
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

function connect() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não está configurada.')
  const pool = new Pool({ connectionString: url })
  // Conexão ociosa derrubada pelo Neon não pode derrubar o servidor.
  pool.on('error', (error: Error) => console.error('[db] conexão ociosa caiu', error.message))
  return drizzle(pool, { schema })
}

type Db = ReturnType<typeof connect>
let db: Db | undefined

// Conecta só no primeiro uso, para o build não depender do banco. Usa Pool
// (WebSocket) porque o driver HTTP do Neon não faz transação interativa.
export function getDb() {
  return (db ??= connect())
}

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Banco ou transação: quem recebe funciona nos dois.
export type Executor = Db | Tx
