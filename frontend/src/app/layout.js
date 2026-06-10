import './globals.css';
import Sidebar from './components/Sidebar';

export const metadata = {
  title: 'Indian Cuisine Tracker | AI Powered Nutrition',
  description: 'Track macros and micronutrients for complex Indian meals using Vision AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <div className="container">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
