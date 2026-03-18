// src/app/sitemap.ts
// Auto-generated sitemap — Next.js reads this and serves /sitemap.xml
// Includes the homepage, blog index, and all published blog posts.

import { MetadataRoute } from 'next'
import { getAllBlogPosts } from '@/lib/notion'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof getAllBlogPosts>> = []
  try {
    posts = await getAllBlogPosts()
  } catch (err) {
    console.error('sitemap: failed to fetch blog posts', err)
  }

  const blogEntries = posts.map(post => ({
    url: `https://thewatchoracle.com/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: 'https://thewatchoracle.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://thewatchoracle.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogEntries,
  ]
}
