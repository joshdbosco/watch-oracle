// src/lib/notion.ts
// Every Notion operation lives here. The rest of the app imports from this file
// and never touches the Notion client directly.

import { Client } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Watch, Submission } from './types'

// ── Client (singleton) ────────────────────────────────────────────────────────
// Only created once per server process. Safe for Next.js server components.
const notion = new Client({ auth: process.env.NOTION_API_KEY })

const WATCHES_DB  = process.env.NOTION_WATCHES_DB_ID!
const SUBMISSIONS_DB = process.env.NOTION_SUBMISSIONS_DB_ID!

// ── Helpers ───────────────────────────────────────────────────────────────────
// Notion returns a complex object for each property. These helpers extract
// the plain value we care about and nothing else.

function getText(page: PageObjectResponse, prop: string): string {
  const p = page.properties[prop]
  if (!p) return ''
  if (p.type === 'title')       return p.title.map(t => t.plain_text).join('')
  if (p.type === 'rich_text')   return p.rich_text.map(t => t.plain_text).join('')
  return ''
}

function getMultiSelect(page: PageObjectResponse, prop: string): string[] {
  const p = page.properties[prop]
  if (!p || p.type !== 'multi_select') return []
  return p.multi_select.map(o => o.name)
}

// Converts a Notion page into our clean Watch type
function pageToWatch(page: PageObjectResponse): Watch {
  return {
    id:    page.id,
    name:  getText(page, 'Name'),
    brand: getText(page, 'Brand'),
    price: getText(page, 'Price'),
    tags:  getMultiSelect(page, 'Tags'),
    pitch: getText(page, 'Pitch'),
  }
}

// ── Watches ───────────────────────────────────────────────────────────────────

// Fetch all watches from Notion. Called at request-time from the quiz and admin pages.
// Next.js caches this automatically in production — watches update when you next deploy
// or when the cache is revalidated (see below).
export async function getAllWatches(): Promise<Watch[]> {
  const results: PageObjectResponse[] = []
  let cursor: string | undefined

  // Notion returns max 100 results per page — loop until we have them all
  do {
    const res = await notion.databases.query({
      database_id: WATCHES_DB,
      start_cursor: cursor,
      page_size: 100,
      sorts: [{ property: 'Brand', direction: 'ascending' }],
    })
    results.push(...res.results as PageObjectResponse[])
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  return results.map(pageToWatch)
}

// Create a new watch page in Notion
export async function createWatch(data: Omit<Watch, 'id'>): Promise<Watch> {
  const page = await notion.pages.create({
    parent: { database_id: WATCHES_DB },
    properties: {
      Name:  { title:        [{ text: { content: data.name  } }] },
      Brand: { rich_text:    [{ text: { content: data.brand } }] },
      Price: { rich_text:    [{ text: { content: data.price } }] },
      Pitch: { rich_text:    [{ text: { content: data.pitch } }] },
      Tags:  { multi_select: data.tags.map(t => ({ name: t })) },
    },
  }) as PageObjectResponse
  return pageToWatch(page)
}

// Update an existing watch page
export async function updateWatch(id: string, data: Omit<Watch, 'id'>): Promise<Watch> {
  const page = await notion.pages.update({
    page_id: id,
    properties: {
      Name:  { title:        [{ text: { content: data.name  } }] },
      Brand: { rich_text:    [{ text: { content: data.brand } }] },
      Price: { rich_text:    [{ text: { content: data.price } }] },
      Pitch: { rich_text:    [{ text: { content: data.pitch } }] },
      Tags:  { multi_select: data.tags.map(t => ({ name: t })) },
    },
  }) as PageObjectResponse
  return pageToWatch(page)
}

// Soft-delete: archive the page rather than permanently destroying it.
// Archived pages can be restored from Notion if you make a mistake.
export async function deleteWatch(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true })
}

// ── Submissions ───────────────────────────────────────────────────────────────
// Save a quiz submission to Notion so you have a full record alongside the email

export async function saveSubmission(data: Submission): Promise<void> {
  await notion.pages.create({
    parent: { database_id: SUBMISSIONS_DB },
    properties: {
      Name:  { title:     [{ text: { content: data.name || 'Anonymous' } }] },
      Email: { email:     data.email },
      Extra: { rich_text: [{ text: { content: data.extra } }] },
      Tags:  { rich_text: [{ text: { content: data.tags.join(', ') } }] },
    },
  })
}
