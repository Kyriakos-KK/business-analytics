// Payload REST API — handles all /api/* endpoints automatically.
// Examples: GET /api/articles, POST /api/articles, GET /api/users/me
// You do NOT need to edit this file.
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import configPromise from '@payload-config'

export const GET    = REST_GET(configPromise)
export const POST   = REST_POST(configPromise)
export const DELETE = REST_DELETE(configPromise)
export const PATCH  = REST_PATCH(configPromise)
