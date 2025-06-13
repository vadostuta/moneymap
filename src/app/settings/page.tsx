import { redirect } from 'next/navigation'

export default function SettingsPage () {
  // You can change this to any default settings page you prefer
  const defaultSettingsPage = 'account'
  redirect(`/settings/${defaultSettingsPage}`)
}
