'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    age: 25,
    gender: 'male',
    height_cm: 175,
    weight_kg: 70,
    body_fat_pct: 15,
    activity_level: '1.55', // Moderate
    fitness_goal: 'maintain'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Load existing profile if exists
          const docSnap = await getDoc(doc(db, `users/${currentUser.uid}`));
          if (docSnap.exists()) {
             setFormData({ ...formData, ...docSnap.data() });
          }
        } catch (err) {
          console.error("Failed to load profile (likely Firestore rules):", err);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTargets = () => {
    const w = parseFloat(formData.weight_kg);
    const h = parseFloat(formData.height_cm);
    const a = parseFloat(formData.age);
    
    // Mifflin-St Jeor
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += formData.gender === 'male' ? 5 : -161;
    
    let tdee = bmr * parseFloat(formData.activity_level);
    
    if (formData.fitness_goal === 'cut') tdee -= 500;
    if (formData.fitness_goal === 'bulk') tdee += 500;
    
    const targetKcal = Math.round(tdee);
    
    // High protein for Indian diet tracking usually helps
    const protein_g = Math.round(w * 2.0); // 2g per kg
    const fat_g = Math.round((targetKcal * 0.25) / 9); // 25% from fat
    const carbs_g = Math.round((targetKcal - (protein_g * 4) - (fat_g * 9)) / 4);
    
    return { targetKcal, protein_g, carbs_g, fat_g };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const targets = calculateTargets();
      
      const payload = {
        ...formData,
        age: Number(formData.age),
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
        body_fat_pct: Number(formData.body_fat_pct),
        tdee_kcal: targets.targetKcal,
        daily_goals: {
           protein_g: targets.protein_g,
           carbs_g: targets.carbs_g,
           fat_g: targets.fat_g
        },
        updated_at: new Date()
      };

      await setDoc(doc(db, `users/${user.uid}`), payload, { merge: true });
      router.push('/dashboard');
    } catch (err) {
      console.error("Error saving profile", err);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '4rem'}}>Loading...</div>;

  return (
    <div className="glass-panel" style={{maxWidth: '600px', margin: '2rem auto'}}>
      <h1 className="heading-gradient" style={{fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center'}}>Your Profile & Goals</h1>
      
      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div style={{flex: 1}}>
             <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Age</label>
             <input type="number" name="age" value={formData.age} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={{flex: 1}}>
             <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Gender</label>
             <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
               <option value="male">Male</option>
               <option value="female">Female</option>
             </select>
          </div>
        </div>

        <div style={{display: 'flex', gap: '1rem'}}>
          <div style={{flex: 1}}>
             <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Height (cm)</label>
             <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={{flex: 1}}>
             <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Weight (kg)</label>
             <input type="number" name="weight_kg" step="0.1" value={formData.weight_kg} onChange={handleChange} style={inputStyle} required />
          </div>
        </div>
        
        <div>
           <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Body Fat % (Optional)</label>
           <input type="number" name="body_fat_pct" value={formData.body_fat_pct} onChange={handleChange} style={inputStyle} />
        </div>

        <div>
           <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Activity Level</label>
           <select name="activity_level" value={formData.activity_level} onChange={handleChange} style={inputStyle}>
             <option value="1.2">Sedentary (office job)</option>
             <option value="1.375">Lightly Active (1-3 days/week)</option>
             <option value="1.55">Moderately Active (3-5 days/week)</option>
             <option value="1.725">Very Active (6-7 days/week)</option>
             <option value="1.9">Extra Active (physical job)</option>
           </select>
        </div>

        <div>
           <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>Fitness Goal</label>
           <div style={{display: 'flex', gap: '1rem'}}>
             {['cut', 'maintain', 'bulk'].map(goal => (
                <div 
                   key={goal}
                   onClick={() => setFormData({...formData, fitness_goal: goal})}
                   style={{
                     flex: 1, textAlign: 'center', padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                     border: formData.fitness_goal === goal ? '2px solid var(--accent-color)' : '2px solid var(--border-color)',
                     background: formData.fitness_goal === goal ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                     textTransform: 'capitalize'
                   }}>
                   {goal}
                </div>
             ))}
           </div>
        </div>

        <button type="submit" className="btn-primary" style={{marginTop: '1.5rem'}} disabled={saving}>
           {saving ? 'Calculating...' : 'Save & Calculate Targets'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-color)',
  color: 'white',
  fontSize: '1rem',
  outline: 'none'
};
