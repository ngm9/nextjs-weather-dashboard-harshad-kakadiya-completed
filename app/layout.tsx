import './globals.css'

export const metadata = {
  title: 'Weather Dashboard',
  description: 'Search and view weather information for any city',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
