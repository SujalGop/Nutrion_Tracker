'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function ClientNav() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        return onAuthStateChanged(auth, setUser);
    }, []);

    return (
        <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
            {user && (
                <>
                   <Link href="/dashboard" style={{color: 'var(--text-secondary)', textDecoration: 'none'}}>Dashboard</Link>
                   <Link href="/" style={{color: 'var(--text-secondary)', textDecoration: 'none'}}>Log Meal</Link>
                   <Link href="/profile" style={{color: 'var(--text-secondary)', textDecoration: 'none'}}>Settings</Link>
                </>
            )}
        </div>
    );
}
