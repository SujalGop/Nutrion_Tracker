'use client';
import { useState, useRef, useEffect } from 'react';
import { auth, storage, db } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function Home() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingMacros, setIsFetchingMacros] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [finalMacros, setFinalMacros] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Sign-in error:", err);
      setError("Failed to sign in.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!user) {
         setError("Please sign in first to upload meals.");
         return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    setPrediction(null);
    setFinalMacros(null);
    
    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `meals/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      // 2. Call our API Route
      const idToken = await user.getIdToken();
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ imageUrl: downloadURL })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }
      
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Error analyzing image:", err);
      if (err.message.includes('unauthorized') || err.message.includes('permission')) {
          setError("Storage Error: Your Firebase Storage rules are blocking the upload. Please update them in the console.");
      } else {
          setError(`Analysis Failed: ${err.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWeightChange = (index, newWeight) => {
    const updatedIngredients = [...prediction.ingredients];
    updatedIngredients[index].weight_g = Number(newWeight);
    setPrediction({...prediction, ingredients: updatedIngredients});
  };

  const verifyAndLog = async () => {
    if (!prediction || !user) return;
    setIsFetchingMacros(true);
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/fetch-macros', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ ingredients: prediction.ingredients })
        });
        if (!response.ok) throw new Error("Failed to fetch macros");
        
        const data = await response.json();
        setFinalMacros(data.data);
        
        // Log to Firestore skeleton
        const today = new Date().toISOString().split('T')[0];
        await addDoc(collection(db, `users/${user.uid}/daily_logs`), {
            date: today,
            timestamp: new Date(),
            macros: data.data
        });
        
    } catch(err) {
        console.error("Logging error", err);
        setError("Failed to log meal and fetch macros.");
    } finally {
        setIsFetchingMacros(false);
    }
  };

  return (
    <div className={styles.hero}>
      <div style={{position: 'absolute', top: '1rem', right: '2rem', zIndex: 100}}>
         {!user ? (
            <button className="btn-primary" style={{padding: '8px 16px', fontSize: '0.9rem'}} onClick={handleSignIn}>Sign In with Google</button>
         ) : (
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
               <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{user.displayName}</span>
               <button className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem'}} onClick={() => signOut(auth)}>Sign Out</button>
            </div>
         )}
      </div>

      <h1 className={styles.title} style={{fontSize: '3.5rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center'}}>
        AI Nutrition <br/>
        <span className="heading-gradient">for Indian Cuisine</span>
      </h1>
      <p className={styles.subtitle} style={{textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem auto'}}>
        Snap a photo of your complex mixed meals. Our AI precisely identifies the dish, decomposes the ingredients, and logs your exact macros.
      </p>

      <div className={styles.uploadContainer} style={{maxWidth: '600px', margin: '0 auto'}}>
        {!previewUrl ? (
          <div className="glass-panel" style={{textAlign: 'center', padding: '3rem 2rem'}}>
            <span className="upload-icon" style={{fontSize: '4rem'}}>📸</span>
            <h3 style={{marginBottom: '2rem', fontSize: '1.5rem'}}>Add your meal</h3>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
              <button className="btn-primary" onClick={() => cameraInputRef.current.click()} style={{flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <span style={{fontSize: '1.2rem'}}>📷</span> Take Photo
              </button>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <span style={{fontSize: '1.2rem'}}>📁</span> Upload Gallery
              </button>
            </div>
            
            <input type="file" hidden ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleImageUpload} />
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
            {error && <p style={{color: 'var(--accent-color)', marginTop: '1rem'}}>{error}</p>}
          </div>
        ) : (
          <div className="glass-panel" style={{padding: '1.5rem'}}>
            <img src={previewUrl} alt="Meal Preview" style={{width: '100%', borderRadius: '16px', maxHeight: '350px', objectFit: 'cover', border: '1px solid var(--border-color)'}} />
            
            {isAnalyzing ? (
              <div style={{textAlign: 'center', padding: '3rem 1rem'}}>
                <div className="heading-gradient" style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem'}}>
                  Analyzing with Gemini...
                </div>
                <p style={{color: 'var(--text-secondary)'}}>Decomposing ingredients based on visual data</p>
                <div style={{width: '40px', height: '40px', border: '3px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%', margin: '1.5rem auto 0', animation: 'spin 1s linear infinite'}}></div>
              </div>
            ) : error ? (
               <div style={{textAlign: 'center', padding: '2rem', color: 'var(--accent-color)'}}>
                 <p>{error}</p>
                 <button className="btn-secondary" style={{marginTop: '1rem'}} onClick={() => {setPreviewUrl(null); setError(null);}}>Try Again</button>
               </div>
            ) : finalMacros ? (
               <div style={{marginTop: '2rem'}}>
                  <h3 className="heading-gradient" style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Meal Logged Successfully!</h3>
                  <div style={{background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem'}}>
                     {finalMacros.map((m, i) => (
                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i !== finalMacros.length - 1 ? '1px solid var(--border-color)' : 'none'}}>
                           <span style={{textTransform: 'capitalize'}}>{m.ingredient} ({m.weight_g}g)</span>
                           <span style={{color: 'var(--text-secondary)'}}>{m.macros.kcal} kcal</span>
                        </div>
                     ))}
                  </div>
                  <button className="btn-primary" style={{width: '100%', marginTop: '1.5rem'}} onClick={() => {setPreviewUrl(null); setFinalMacros(null); setPrediction(null);}}>Log Another Meal</button>
               </div>
            ) : prediction ? (
              <div className={styles.resultsContainer} style={{marginTop: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <h2 style={{fontSize: '1.5rem'}}>Identified Ingredients</h2>
                </div>
                
                <div style={{background: 'rgba(255, 142, 83, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '12px', padding: '16px', marginBottom: '1.5rem'}}>
                  <p style={{fontSize: '0.95rem', color: '#ff8e53', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                    <span style={{fontSize: '1.2rem'}}>⚠️</span> 
                    <span>We estimated these base ingredients and quantities from the image. <strong>Please verify and adjust them</strong> before logging for accurate macros.</span>
                  </p>
                </div>

                <div style={{background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden'}}>
                  {prediction.ingredients.map((ing, idx) => (
                    <div key={idx} style={{display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: idx !== prediction.ingredients.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.2s hover:rgba(255,255,255,0.05)'}}>
                      <span style={{fontWeight: '500', flex: 1, textTransform: 'capitalize', fontSize: '1.1rem'}}>{ing.ingredient}</span>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px 8px', border: '1px solid var(--border-color)'}}>
                         <input 
                           type="number" 
                           value={ing.weight_g} 
                           onChange={(e) => handleWeightChange(idx, e.target.value)}
                           style={{width: '60px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', outline: 'none', textAlign: 'right', fontWeight: '600'}}
                         />
                         <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}>g</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                  <button className="btn-primary" style={{flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={verifyAndLog} disabled={isFetchingMacros}>
                    {isFetchingMacros ? 'Fetching Macros...' : 'Verify & Log Meal'}
                  </button>
                  <button className="btn-secondary" style={{flex: 1}} onClick={() => setPreviewUrl(null)}>Cancel</button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
