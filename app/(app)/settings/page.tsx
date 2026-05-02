import { requireUser } from '@/lib/auth'
import { SettingsClient } from '@/components/forms/SettingsClient'

export default async function SettingsPage() {
  const user = await requireUser()
  return <SettingsClient user={user} />
}
