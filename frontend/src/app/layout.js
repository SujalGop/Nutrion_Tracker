import './globals.css';
import ClientNav from './ClientNav';

export const metadata = {
  title: 'Indian Cuisine Tracker | AI Powered Nutrition',
  description: 'Track macros and micronutrients for complex Indian meals using Vision AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontWeight: 'bold', fontSize: '1.2rem'}} className="heading-gradient">NutriTracker AI</div>
          <ClientNav />
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
