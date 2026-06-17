import "./globals.css"
import { AuthProvider } from './context/AuthContext'

export const metadata = {
  title: "Business Lead Finder",
  description: "Business Lead Finder",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
