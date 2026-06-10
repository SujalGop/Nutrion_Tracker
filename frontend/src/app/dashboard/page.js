'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchData(currentUser.uid);
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchData = async (uid) => {
    try {
        // Fetch Profile
        const docSnap = await getDoc(doc(db, `users/${uid}`));
        if (!docSnap.exists()) {
            router.push('/profile');
            return;
        }
        setProfile(docSnap.data());

        // Fetch Today's Logs
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, `users/${uid}/daily_logs`), where("date", "==", today));
        const querySnapshot = await getDocs(q);
        
        const aggregated = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, meals: [] };
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            aggregated.meals.push(data);
            data.macros.forEach(m => {
                aggregated.kcal += m.macros.kcal;
                aggregated.protein_g += m.macros.protein_g;
                aggregated.carbs_g += m.macros.carbs_g;
                aggregated.fat_g += m.macros.fat_g;
            });
        });
        
        setDailyLog(aggregated);
    } catch (err) {
        console.error("Dashboard error", err);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '4rem'}}>Loading Dashboard...</div>;
  if (!profile) return null;

  return (
    <div style={{maxWidth: '900px', margin: '2rem auto'}}>
       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <div>
            <h1 style={{fontSize: '2.5rem'}}>Welcome, <span className="heading-gradient">{user?.displayName?.split(' ')[0] || 'User'}</span></h1>
            <p style={{color: 'var(--text-secondary)'}}>Here is your daily nutrition summary.</p>
          </div>
          <button className="btn-primary" onClick={() => router.push('/')}>+ Log Meal</button>
       </div>

       <div className="glass-panel" style={{marginBottom: '2rem'}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-secondary)'}}>Calories</h2>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '1rem'}}>
             <span style={{fontSize: '3rem', fontWeight: 'bold', lineHeight: '1'}}>{Math.round(dailyLog?.kcal || 0)}</span>
             <span style={{color: 'var(--text-secondary)', fontSize: '1.2rem', paddingBottom: '6px'}}>/ {profile.tdee_kcal} kcal</span>
          </div>
          <ProgressBar current={dailyLog?.kcal || 0} max={profile.tdee_kcal} color="var(--accent-color)" />
       </div>

       <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
          <MacroCard title="Protein" current={dailyLog?.protein_g} max={profile.daily_goals.protein_g} color="#4facfe" />
          <MacroCard title="Carbs" current={dailyLog?.carbs_g} max={profile.daily_goals.carbs_g} color="#f093fb" />
          <MacroCard title="Fat" current={dailyLog?.fat_g} max={profile.daily_goals.fat_g} color="#f5576c" />
       </div>
    </div>
  );
}

function MacroCard({ title, current = 0, max = 0, color }) {
    return (
        <div className="glass-panel" style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <span style={{fontWeight: '600', color: 'var(--text-secondary)'}}>{title}</span>
                <span>{Math.round(current)}g / {Math.round(max)}g</span>
            </div>
            <ProgressBar current={current} max={max} color={color} />
        </div>
    );
}

function ProgressBar({ current, max, color }) {
    const pct = Math.min((current / max) * 100, 100) || 0;
    return (
        <div style={{width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden'}}>
            <div style={{width: \`\${pct}%\`, height: '100%', background: color, transition: 'width 1s ease', borderRadius: '6px'}}></div>
        </div>
    );
}
