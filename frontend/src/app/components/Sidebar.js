'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Sidebar() {
    const [user, setUser] = useState(null);
    const pathname = usePathname();

    useEffect(() => {
        return onAuthStateChanged(auth, setUser);
    }, []);

    if (!user) return null;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '🏠' },
        { path: '/log-meal', label: 'Log Meal', icon: '📸' },
        { path: '/profile', label: 'Profile Settings', icon: '⚙️' }
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header">
                <div className="heading-gradient" style={{fontWeight: 'bold', fontSize: '1.5rem'}}>NutriTracker</div>
                <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>{user.displayName}</div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            href={item.path}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <span style={{fontSize: '1.2rem'}}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="btn-secondary" style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem'}} onClick={() => signOut(auth)}>
                    <span>🚪</span> Sign Out
                </button>
            </div>
        </aside>
    );
}
