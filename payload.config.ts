import sharp from 'sharp'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { Articles } from './collections/Articles'
import { Users } from './collections/Users'

// These two lines let us get the current file's directory path in ESM (ES Modules)
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Admin panel settings ──────────────────────────────────
  admin: {
    user: Users.slug,                          // Users collection handles admin login
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  // ── Collections ───────────────────────────────────────────
  collections: [Articles, Users],

  // ── Rich text editor ──────────────────────────────────────
  editor: lexicalEditor({}),

  // ── Security secret ───────────────────────────────────────
  // Sign JWT tokens for admin sessions. Set PAYLOAD_SECRET in your environment.
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-change-in-production',

  // ── TypeScript type generation ────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── Database ──────────────────────────────────────────────
  // WHY PostgreSQL instead of SQLite:
  //   SQLite stores data in a local file (payload.db). Vercel's serverless
  //   functions run in ephemeral, read-only containers — they cannot write to
  //   the filesystem, so SQLite always fails in production with:
  //   "Unable to open connection to local database ./payload.db"
  //
  //   PostgreSQL is a proper network database server (hosted on Railway here).
  //   Vercel functions connect to it over TCP using a connection string, which
  //   works perfectly in a serverless/ephemeral environment.
  //
  // WHAT CHANGED:
  //   Before: sqliteAdapter from @payloadcms/db-sqlite
  //   After:  postgresAdapter from @payloadcms/db-postgres
  //
  //   DATABASE_URI must now be a PostgreSQL connection string:
  //   postgresql://user:password@host:5432/dbname
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),

  // ── Image processing ──────────────────────────────────────
  sharp,
})
