import './globals.css'

export const metadata = {
  title: 'Invoice Forecasting | AI-Powered Financial Solutions',
  description: 'Building intelligent systems for invoice prediction and financial automation with AI and machine learning.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black leading-relaxed text-gray-300 antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  )
}
