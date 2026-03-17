// src/app/admin/page.tsx
// Server component — checks the session cookie.
// If not logged in → shows the login form.
// If logged in → renders the full admin editor.

import { isAdminLoggedIn } from '@/lib/session'
import { getAllWatches } from '@/lib/notion'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminEditor } from '@/components/AdminEditor'

export const dynamic = 'force-dynamic' // Never cache the admin page

export default async function AdminPage() {
  const loggedIn = await isAdminLoggedIn()

  if (!loggedIn) {
    return <AdminLogin />
  }

  const watches = await getAllWatches()
  return <AdminEditor initialWatches={watches} />
}
