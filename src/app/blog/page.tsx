// src/app/blog/page.tsx
// Blog index — lists all Published posts from Notion.
// Revalidates every hour so new posts appear without redeploy.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/notion'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Watch Gift Guides — The Watch Oracle',
  description: 'Practical guides for buying a watch as a gift. No jargon, no fuss. Just the right answer.',
  alternates: { canonical: 'https://thewatchoracle.com/blog' },
}

export default async function BlogIndex() {
  const posts = await getAllBlogPosts()

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 40px 120px', position: 'relative', zIndex: 1 }}>

      {/* Masthead */}
      <div style={{
        padding: '36px 0 14px',
        marginBottom: 72,
        borderBottom: '1px solid var(--ink)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'end',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '.45em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          textDecoration: 'none',
        }}>
          The Watch Oracle
        </Link>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '.22em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}>
          Watch Gifting
        </span>
      </div>

      {/* Heading */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '.5em',
        color: 'var(--rust)',
        textTransform: 'uppercase',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        Guides
        <span style={{ flex: 1, height: 1, background: 'var(--rule)', display: 'block' }} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px, 8vw, 64px)',
        fontWeight: 300,
        lineHeight: 1.0,
        letterSpacing: '-.025em',
        marginBottom: 48,
      }}>
        Watch gift<br /><em style={{ fontStyle: 'italic', color: 'var(--rust)' }}>guides.</em>
      </h1>

      {/* Post list */}
      {posts.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontStyle: 'italic', color: 'var(--muted)' }}>
          No posts yet.
        </p>
      ) : (
        <div>
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{
                borderTop: i === 0 ? '2px solid var(--rust)' : '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
                padding: '22px 0',
                marginBottom: -1,
                cursor: 'pointer',
              }}>
                {post.publishedAt && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '.35em',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}>
                    {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                )}
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 3.5vw, 26px)',
                  fontWeight: 400,
                  lineHeight: 1.15,
                  marginBottom: 10,
                }}>
                  {post.title}
                </h2>
                {post.metaDesc && (
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: 'var(--muted)',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {post.metaDesc}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 72, borderTop: '1px solid var(--rule)', paddingTop: 40, textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontStyle: 'italic',
          color: 'var(--muted)',
          marginBottom: 24,
          lineHeight: 1.7,
        }}>
          Ready to find the right watch?
        </p>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'stretch',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '.38em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              padding: '15px 26px',
              border: '1px solid var(--ink)',
              borderRight: 'none',
            }}>
              Start the quiz
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '15px 18px',
              background: 'var(--rust)',
              color: 'var(--paper)',
              fontSize: 17,
            }}>
              →
            </span>
          </button>
        </Link>
      </div>

    </main>
  )
}
