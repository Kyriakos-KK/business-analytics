import type { CollectionConfig } from 'payload'

// Users collection — required for the Payload CMS admin login.
// When you first open /admin, Payload asks you to create the first admin user.
// auth: true automatically adds email, password, and session fields.
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
  ],
}
