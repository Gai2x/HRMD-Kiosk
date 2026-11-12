import { AdminLogin } from '../../components/admin/AdminLogin'
import { AdminSessionProvider } from '../../components/admin/AdminSession'

/**
 * Sign-in route. It sits outside the `(workspace)` group so the sidebar shell
 * is never rendered here, and the edge middleware redirects it away once a
 * valid session exists.
 */
export default function HRMDAdminLoginPage() {
  return (
    <AdminSessionProvider>
      <AdminLogin />
    </AdminSessionProvider>
  )
}
