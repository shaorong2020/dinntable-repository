import './globals.css'

export const metadata = {
  title: 'DinnerTable - Family News Discussions',
  description: 'Curated news for meaningful family conversations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
