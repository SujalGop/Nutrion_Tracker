'use client';
import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default function Dashboard() {
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded targets for demo purposes (would normally come from User profile)
  const targets = {
    calories: 2200,
    protein: 150,
    carbs: 200,
    fat: 70
  };

  useEffect(() => {
    async function fetchLog() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/users/demo-user-123/daily-log`);
        const data = await res.json();
        setDailyLog(data);
      } catch (err) {
        console.error("Failed to fetch daily log:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLog();
  }, []);

  if (loading) return <div className={styles.container}>Loading Dashboard...</div>;

  const log = dailyLog || { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };

  const getPercentage = (actual, target) => Math.min((actual / target) * 100, 100);

  return (
    <div className={styles.container}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1 className="heading-gradient" style={{fontSize: '2.5rem', fontWeight: 700}}>Daily Summary</h1>
        <Link href="/" className="btn-secondary" style={{textDecoration: 'none'}}>Log a Meal</Link>
      </div>

      <div className="glass-panel">
        <h2 style={{marginBottom: '1.5rem', color: 'var(--text-secondary)'}}>Today's Macros</h2>
        
        <div className={styles.macroGrid}>
          <div className={styles.macroCard}>
            <h3>Calories</h3>
            <div className={styles.value}>{Math.round(log.total_calories)} / {targets.calories}</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: `${getPercentage(log.total_calories, targets.calories)}%`, background: 'var(--accent-gradient)'}}></div>
            </div>
          </div>
          
          <div className={styles.macroCard}>
            <h3>Protein</h3>
            <div className={styles.value}>{Math.round(log.total_protein)}g / {targets.protein}g</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: `${getPercentage(log.total_protein, targets.protein)}%`, background: '#4facfe'}}></div>
            </div>
          </div>
          
          <div className={styles.macroCard}>
            <h3>Carbs</h3>
            <div className={styles.value}>{Math.round(log.total_carbs)}g / {targets.carbs}g</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: `${getPercentage(log.total_carbs, targets.carbs)}%`, background: '#43e97b'}}></div>
            </div>
          </div>
          
          <div className={styles.macroCard}>
            <h3>Fat</h3>
            <div className={styles.value}>{Math.round(log.total_fat)}g / {targets.fat}g</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: `${getPercentage(log.total_fat, targets.fat)}%`, background: '#fa709a'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
