import sharp from 'sharp'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
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
  // Every collection you add here appears in the /admin sidebar
  collections: [Articles, Users],

  // ── Rich text editor (used by Payload admin UI internally) ─
  editor: lexicalEditor({}),

  // ── Security secret ───────────────────────────────────────
  // Used to sign JWT tokens for admin sessions. ALWAYS change in production.
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-change-in-production',

  // ── TypeScript type generation ────────────────────────────
  // Running "npm run generate:types" creates payload-types.ts automatically
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── Database ──────────────────────────────────────────────
  // SQLite: stores everything in a single file (payload.db) in the project root.
  // No external database server, no XAMPP, no MySQL — it just works.
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./payload.db',
    },
  }),

  // ── Image processing ──────────────────────────────────────
  sharp,
})
