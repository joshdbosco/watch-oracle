// src/lib/notion.ts
// Verified against live Notion schemas 2026-03-17.
//
// WATCHES DB  — 9cc10bef1a1f41a7a8ff4b660b04da2a
//   Name, Brand, Price, Price Number, Pitch, Tags (multi_select),
//   Level, Brand Type, Watch Type, Watch Character, Case Size,
//   Hobbies, Personality
//
// SUBMISSIONS DB — 1b6c3473db734e25921387e52d67784c
//   Name, Email, Budget (select), Extra, Quiz Tags,
//   IP Address, User Agent, Country,
//   Result 1, Result 2, Result 3,
//   Replied (checkbox), Submitted At (created_time), Notes

import { Client } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Watch, Submission } from './types'

// ── Client ─────────────────────────────────────────────────────────────────
const notion = new Client({ auth: process.env.NOTION_API_KEY })

const WATCHES_DB     = process.env.NOTION_WATCHES_DB_ID!
const SUBMISSIONS_DB = process.env.NOTION_SUBMISSIONS_DB_ID!

// ── Property readers ────────────────────────────────────────────────────────
function readTitle(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'title') return ''
  return p.title.map((t: any) => t.plain_text).join('')
}

function readRichText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'rich_text') return ''
  return p.rich_text.map((t: any) => t.plain_text).join('')
}

function readMultiSelect(page: PageObjectResponse, prop: string): string[] {
  const p = page.properties[prop]
  if (!p || p.type !== 'multi_select') return []
  return p.multi_select.map((o: any) => o.name)
}

// ── Watch converter ─────────────────────────────────────────────────────────
function pageToWatch(page: PageObjectResponse): Watch {
  return {
    id:    page.id,
    name:  readTitle(page, 'Name'),
    brand: readRichText(page, 'Brand'),
    price: readRichText(page, 'Price'),
    tags:  readMultiSelect(page, 'Tags'),
    pitch: readRichText(page, 'Pitch'),
  }
}

// ── Watch reads ─────────────────────────────────────────────────────────────
export async function getAllWatches(): Promise<Watch[]> {
  const results: PageObjectResponse[] = []
  let cursor: string | undefined

  do {
    const res = await notion.databases.query({
      database_id: WATCHES_DB,
      start_cursor: cursor,
      page_size: 100,
      filter: { property: 'Name', title: { is_not_empty: true } },
      sorts:  [{ property: 'Brand', direction: 'ascending' }],
    })
    results.push(...(res.results as PageObjectResponse[]))
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  return results.map(pageToWatch)
}

// ── Submissions ─────────────────────────────────────────────────────────────
const BUDGET_TO_LABEL: Record<string, string> = {
  budget_entry:    'Under 300',
  budget_mid:      '300 to 800',
  budget_upper:    '800 to 2000',
  budget_luxury:   '2000 to 3000',
  budget_personal: 'Above 3000',
}

export async function saveSubmission(data: Submission): Promise<void> {
  const budgetTag   = data.tags.find(t => t.startsWith('budget_')) ?? ''
  const budgetLabel = BUDGET_TO_LABEL[budgetTag]
  const otherTags   = data.tags.filter(t => !t.startsWith('budget_')).join(', ')

  await notion.pages.create({
    parent: { database_id: SUBMISSIONS_DB },
    properties: {
      Name:          { title:     [{ text: { content: data.name || 'Anonymous' } }] },
      Email:         { email:     data.email },
      ...(budgetLabel && { Budget: { select: { name: budgetLabel } } }),
      Extra:         { rich_text: [{ text: { content: data.extra || '' } }] },
      'Quiz Tags':   { rich_text: [{ text: { content: otherTags } }] },
      'IP Address':  { rich_text: [{ text: { content: data.ip || '' } }] },
      'User Agent':  { rich_text: [{ text: { content: data.userAgent || '' } }] },
      'Country':     { rich_text: [{ text: { content: data.country || '' } }] },
      'Result 1':    { rich_text: [{ text: { content: data.results?.[0] || '' } }] },
      'Result 2':    { rich_text: [{ text: { content: data.results?.[1] || '' } }] },
      'Result 3':    { rich_text: [{ text: { content: data.results?.[2] || '' } }] },
      Replied:       { checkbox: false },
    } as any,
  })
}

// ── Blog ────────────────────────────────────────────────────────────────────
// BLOG DB — bdb2a3d2847343f495cc979b339f6d50
//   Title (title), Slug (rich_text), Status (select: Draft/Ready/Published)
//   Target Keyword (rich_text), Meta Description (rich_text)
//   Published Date (date), Word Count (number)
//   Body content lives as Notion page content (blocks)

const BLOG_DB = process.env.NOTION_BLOG_DB_ID!

export interface BlogPost {
  id:          string
  title:       string
  slug:        string
  status:      string
  metaDesc:    string
  keyword:     string
  publishedAt: string | null
  body:        string   // rendered as plain paragraphs from Notion blocks
}

export interface BlogPostSummary {
  id:          string
  title:       string
  slug:        string
  metaDesc:    string
  publishedAt: string | null
}

// Fetch all Published posts for the blog index
export async function getAllBlogPosts(): Promise<BlogPostSummary[]> {
  const res = await notion.databases.query({
    database_id: BLOG_DB,
    filter: {
      property: 'Status',
      select: { equals: 'Published' },
    },
    sorts: [{ property: 'Published Date', direction: 'descending' }],
  })

  return (res.results as PageObjectResponse[]).map(page => ({
    id:          page.id,
    title:       readTitle(page, 'Title'),
    slug:        readRichText(page, 'Slug'),
    metaDesc:    readRichText(page, 'Meta Description'),
    publishedAt: readDate(page, 'Published Date'),
  }))
}

// Fetch a single post by slug — reads blocks for the body
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await notion.databases.query({
    database_id: BLOG_DB,
    filter: {
      and: [
        { property: 'Slug',   rich_text: { equals: slug } },
        { property: 'Status', select:    { equals: 'Published' } },
      ],
    },
    page_size: 1,
  })

  if (!res.results.length) return null

  const page = res.results[0] as PageObjectResponse
  const body = await getPageBody(page.id)

  return {
    id:          page.id,
    title:       readTitle(page, 'Title'),
    slug:        readRichText(page, 'Slug'),
    status:      readSelect(page, 'Status'),
    metaDesc:    readRichText(page, 'Meta Description'),
    keyword:     readRichText(page, 'Target Keyword'),
    publishedAt: readDate(page, 'Published Date'),
    body,
  }
}

// Reads Notion page blocks and converts to HTML string
// Supports: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item,
//           quote, divider, callout
async function getPageBody(pageId: string): Promise<string> {
  const res = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  })

  const html: string[] = []
  let inBullet  = false
  let inOrdered = false

  for (const block of res.results as any[]) {
    const type = block.type

    // Close open lists when we hit a non-list block
    if (type !== 'bulleted_list_item' && inBullet) {
      html.push('</ul>')
      inBullet = false
    }
    if (type !== 'numbered_list_item' && inOrdered) {
      html.push('</ol>')
      inOrdered = false
    }

    switch (type) {
      case 'paragraph': {
        const text = richTextToHtml(block.paragraph.rich_text)
        if (text) html.push(`<p>${text}</p>`)
        break
      }
      case 'heading_1': {
        const text = richTextToHtml(block.heading_1.rich_text)
        html.push(`<h1>${text}</h1>`)
        break
      }
      case 'heading_2': {
        const text = richTextToHtml(block.heading_2.rich_text)
        html.push(`<h2>${text}</h2>`)
        break
      }
      case 'heading_3': {
        const text = richTextToHtml(block.heading_3.rich_text)
        html.push(`<h3>${text}</h3>`)
        break
      }
      case 'bulleted_list_item': {
        if (!inBullet) { html.push('<ul>'); inBullet = true }
        const text = richTextToHtml(block.bulleted_list_item.rich_text)
        html.push(`<li>${text}</li>`)
        break
      }
      case 'numbered_list_item': {
        if (!inOrdered) { html.push('<ol>'); inOrdered = true }
        const text = richTextToHtml(block.numbered_list_item.rich_text)
        html.push(`<li>${text}</li>`)
        break
      }
      case 'quote': {
        const text = richTextToHtml(block.quote.rich_text)
        html.push(`<blockquote>${text}</blockquote>`)
        break
      }
      case 'divider': {
        html.push('<hr />')
        break
      }
      case 'callout': {
        const text = richTextToHtml(block.callout.rich_text)
        html.push(`<div class="callout">${text}</div>`)
        break
      }
    }
  }

  // Close any open lists
  if (inBullet)  html.push('</ul>')
  if (inOrdered) html.push('</ol>')

  return html.join('\n')
}

// Convert Notion rich_text array to HTML string
// Handles bold, italic, code, links, and strikethrough
function richTextToHtml(richText: any[]): string {
  if (!richText?.length) return ''
  return richText.map(t => {
    let text = t.plain_text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (t.annotations?.bold)          text = `<strong>${text}</strong>`
    if (t.annotations?.italic)         text = `<em>${text}</em>`
    if (t.annotations?.code)           text = `<code>${text}</code>`
    if (t.annotations?.strikethrough)  text = `<s>${text}</s>`
    if (t.href)                         text = `<a href="${t.href}">${text}</a>`

    return text
  }).join('')
}

// Read a date property — returns ISO string or null
function readDate(page: PageObjectResponse, prop: string): string | null {
  const p = page.properties[prop]
  if (!p || p.type !== 'date') return null
  return p.date?.start ?? null
}

// Re-export readSelect for use in blog functions
function readSelect(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p || p.type !== 'select') return ''
  return p.select?.name ?? ''
}
