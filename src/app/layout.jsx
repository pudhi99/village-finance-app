import './globals.css';

export const metadata = {
  title: 'గ్రామాల వసూళ్ల వివరాలు | Village Collections',
  description: 'Village microfinance and weekly collection management for Edurlanka and Kothapalli with live Google Sheets & Google Drive sync',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'గ్రామాల వసూళ్లు',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F766E',
};

export default function RootLayout({ children }) {
  return (
    <html lang="te">
      <body className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-200 selection:text-teal-900 transition-colors">
        {children}
      </body>
    </html>
  );
}
