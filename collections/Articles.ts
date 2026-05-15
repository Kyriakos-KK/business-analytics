import type { CollectionConfig } from 'payload'

// Articles collection — defines the structure of every article in the CMS.
// Each field here becomes an editable field in the admin dashboard at /admin.
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',                               // title shows as the article name in the list
    defaultColumns: ['title', 'category', 'author', 'createdAt'],
    description: 'Manage news articles for the website.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Article Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: 'URL-friendly identifier, e.g. "musk-vs-openai". Must be unique.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Short Description',
      admin: {
        description: 'One or two sentences shown on the article card on the homepage.',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Full Article Content',
      admin: {
        description: 'Full article body. HTML tags like <h2>, <p>, <ul>, <li> are supported.',
      },
    },
    {
      name: 'image',
      type: 'text',
      label: 'Image Path',
      admin: {
        description: 'Path to the image inside the public folder. Example: /images/article-name.jpg',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'AI & Law',      value: 'AI & Law' },
        { label: 'Industry',      value: 'Industry' },
        { label: 'Models',        value: 'Models' },
        { label: 'Security',      value: 'Security' },
        { label: 'Agents',        value: 'Agents' },
        { label: 'Finance',       value: 'Finance' },
        { label: 'Cybersecurity', value: 'Cybersecurity' },
        { label: 'Health & AI',   value: 'Health & AI' },
        { label: 'Defense',       value: 'Defense' },
        { label: 'Other',         value: 'Other' },
      ],
    },
    {
      name: 'author',
      type: 'text',
      label: 'Author',
      defaultValue: 'Business Analytics',
    },
    {
      name: 'popularity',
      type: 'number',
      label: 'Popularity Score',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Score from 0 to 100. Used for "Most Popular" sorting on the search page.',
      },
    },
  ],
  // Payload automatically adds createdAt and updatedAt to every collection
  timestamps: true,
}
