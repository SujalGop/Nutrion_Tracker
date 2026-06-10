import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import './globals.css';

export const metadata = {
  title: 'Indian Cuisine Tracker | AI Powered Nutrition',
  description: 'Track macros and micronutrients for complex Indian meals using Vision AI.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}} className="heading-gradient">NutriTracker AI</div>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-primary" style={{padding: '8px 16px', fontSize: '0.9rem', margin: 0}}>Sign In</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </nav>
          <main className="container">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
