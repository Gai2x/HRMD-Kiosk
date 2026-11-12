import type { ReactNode } from 'react'
import { AdminShell } from '../../components/admin/AdminShell'

/**
 * Shell for every signed-in module. The edge middleware already redirects
 * anonymous visitors to /hrmd-admin/login; AdminShell additionally waits for
 * /api/auth/me so the UI never flashes staff-only content.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
