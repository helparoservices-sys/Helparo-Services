// Legal consent page with accept button
import ConsentClientPage from './client-page'

export const metadata = {
  title: 'Legal Consent | Helparo',
  description: 'Review and accept Helparo terms of service and privacy policy.',
  robots: 'noindex, nofollow',
}

export default function ConsentPage() {
  return <ConsentClientPage />
}
