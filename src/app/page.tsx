// src/app/page.tsx
// Server component — fetches watches from Notion at request time,
// then passes them down to the client-side quiz.

import { getAllWatches } from '@/lib/notion'
import { QuizApp } from '@/components/QuizApp'

// Revalidate every 5 minutes — so Notion changes appear without a redeploy
export const revalidate = 300

export default async function Home() {
  const watches = await getAllWatches()
  return <QuizApp watches={watches} />
}
