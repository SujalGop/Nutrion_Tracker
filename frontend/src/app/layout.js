import './globals.css';

export const metadata = {
  title: 'Indian Cuisine Tracker | AI Powered Nutrition',
  description: 'Track macros and micronutrients for complex Indian meals using Vision AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
