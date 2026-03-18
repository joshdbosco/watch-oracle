// src/app/blog/[slug]/page.tsx
// Individual blog post — AEO/GEO optimised.
// - JSON-LD Article + FAQPage schema
// - Canonical, OG, Twitter metadata
// - FAQ blocks extracted and rendered with answer/question markup
// - Publisher and author structured data

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/notion'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: `${post.title} — The Watch Oracle`,
    description: post.metaDesc,
    alternates: { canonical: `https://thewatchoracle.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDesc,
      url: `https://thewatchoracle.com/blog/${post.slug}`,
      siteName: 'The Watch Oracle',
      type: 'article',
      ...(post.publishedAt && { publishedTime: post.publishedAt }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDesc,
    },
  }
}

// Extract FAQ pairs from HTML body — finds <h2>Frequently asked questions</h2>
// and the <p> tags that follow in Q/A pairs
function extractFAQs(html: string): { q: string; a: string }[] {
  const faqs: { q: string; a: string }[] = []

  // Find FAQ section
  const faqIdx = html.toLowerCase().indexOf('frequently asked question')
  if (faqIdx === -1) return faqs

  const faqSection = html.slice(faqIdx)

  // Match <strong>Question?</strong> ... paragraph patterns
  const strongRegex = /<strong>([^<]+\?)<\/strong>/g
  const pRegex = /<p>(.*?)<\/p>/gs

  const questions: string[] = []
  let match
  while ((match = strongRegex.exec(faqSection)) !== null) {
    questions.push(match[1])
  }

  const paragraphs: string[] = []
  while ((match = pRegex.exec(faqSection)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    if (text && !text.toLowerCase().includes('frequently')) {
      paragraphs.push(text)
    }
  }

  // Pair them up
  questions.forEach((q, i) => {
    if (paragraphs[i]) {
      faqs.push({ q, a: paragraphs[i] })
    }
  })

  return faqs
}

// Build Article JSON-LD schema
function buildArticleSchema(post: { title: string; metaDesc: string; slug: string; publishedAt: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDesc,
    url: `https://thewatchoracle.com/blog/${post.slug}`,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.publishedAt ?? undefined,
    author: {
      '@type': 'Organization',
      name: 'The Watch Oracle',
      url: 'https://thewatchoracle.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Watch Oracle',
      url: 'https://thewatchoracle.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thewatchoracle.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://thewatchoracle.com/blog/${post.slug}`,
    },
  }
}

// Build FAQPage JSON-LD schema
function buildFAQSchema(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug)
  if (!post) notFound()

  const faqs = extractFAQs(post.body)
  const articleSchema = buildArticleSchema(post)
  const faqSchema = buildFAQSchema(faqs)

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : null

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 40px 120px', position: 'relative', zIndex: 1 }}>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Masthead */}
      <div style={{
        padding: '36px 0 14px',
        marginBottom: 64,
        borderBottom: '1px solid var(--ink)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'end',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '.45em', textTransform: 'uppercase',
          color: 'var(--ink)', textDecoration: 'none',
        }}>
          The Watch Oracle
        </Link>
        <Link href="/blog" style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '.22em', color: 'var(--muted)',
          textTransform: 'uppercase', textDecoration: 'none',
        }}>
          ← All guides
        </Link>
      </div>

      {/* Article header */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '.5em', color: 'var(--rust)',
        textTransform: 'uppercase', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {formattedDate ?? 'Guide'}
        <span style={{ flex: 1, height: 1, background: 'var(--rule)', display: 'block' }} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(32px, 6vw, 52px)',
        fontWeight: 300, lineHeight: 1.05,
        letterSpacing: '-.02em', marginBottom: 24,
      }}>
        {post.title}
      </h1>

      {post.metaDesc && (
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20, fontStyle: 'italic', fontWeight: 300,
          color: 'var(--muted)', lineHeight: 1.7, marginBottom: 56,
          paddingLeft: 20, borderLeft: '2px solid var(--rule)',
        }}>
          {post.metaDesc}
        </p>
      )}

      {/* Article body */}
      <article
        className="blog-body"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {/* CTA */}
      <div style={{
        marginTop: 72, padding: '32px',
        borderTop: '2px solid var(--rust)',
        background: 'var(--surface)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: '.45em', color: 'var(--rust)',
          textTransform: 'uppercase', marginBottom: 12,
        }}>
          Find the right watch
        </div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 19, fontWeight: 300, lineHeight: 1.6,
          marginBottom: 24, color: 'var(--mid)', fontStyle: 'italic',
        }}>
          Seven questions. No watch knowledge needed. We find it. You give it.
        </p>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'stretch',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '.38em', textTransform: 'uppercase',
              color: 'var(--ink)', padding: '15px 26px',
              border: '1px solid var(--ink)', borderRight: 'none',
            }}>
              Start the quiz
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '15px 18px', background: 'var(--rust)', color: 'var(--paper)', fontSize: 17,
            }}>
              →
            </span>
          </button>
        </Link>
      </div>

      <style>{`
        .blog-body {
          font-family: var(--font-display);
          font-size: 19px;
          font-weight: 300;
          line-height: 1.8;
          color: var(--ink);
        }
        .blog-body p { margin-bottom: 28px; }
        .blog-body h2 {
          font-size: clamp(22px, 3.5vw, 28px);
          font-weight: 400; line-height: 1.2;
          margin: 52px 0 20px; letter-spacing: -.01em;
        }
        .blog-body h3 {
          font-size: clamp(18px, 2.5vw, 22px);
          font-weight: 400; line-height: 1.3;
          margin: 36px 0 16px; color: var(--mid);
        }
        .blog-body h1 {
          font-size: clamp(26px, 4vw, 34px);
          font-weight: 400; line-height: 1.15;
          margin: 48px 0 20px;
        }
        .blog-body ul, .blog-body ol {
          margin: 0 0 28px 24px; padding: 0;
        }
        .blog-body li { margin-bottom: 10px; line-height: 1.7; }
        .blog-body blockquote {
          border-left: 2px solid var(--rust);
          padding: 4px 0 4px 20px;
          margin: 36px 0; color: var(--mid); font-style: italic;
        }
        .blog-body hr {
          border: none; border-top: 1px solid var(--rule); margin: 48px 0;
        }
        .blog-body strong { font-weight: 600; color: var(--ink); }
        .blog-body em { font-style: italic; color: var(--mid); }
        .blog-body code {
          font-family: var(--font-mono); font-size: 14px;
          background: var(--surface); padding: 2px 6px;
        }
        .blog-body a {
          color: var(--rust); text-decoration: underline;
          text-decoration-color: rgba(192,64,42,.3);
          text-underline-offset: 3px;
        }
        .blog-body a:hover { text-decoration-color: var(--rust); }
        .blog-body .callout {
          background: var(--surface); border-left: 3px solid var(--rust);
          padding: 16px 20px; margin: 32px 0;
          font-style: italic; color: var(--mid);
        }
      `}</style>
    </main>
  )
}
