'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const router = useRouter();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    setPrediction(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/meals/predict-meal`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("Failed to analyze image. Ensure the backend is running and Gemini API key is valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAmountChange = (index, newAmount) => {
    const updatedIngredients = [...prediction.ingredients];
    updatedIngredients[index].amount = Number(newAmount);
    setPrediction({...prediction, ingredients: updatedIngredients});
  };

  const verifyAndLog = async () => {
    if (!prediction) return;
    try {
        const payload = {
            user_id: "demo-user-123", // Hardcoded for demo
            dish_name: prediction.dish_name,
            ingredients: prediction.ingredients
        };
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/meals/verify-and-log-meal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if(response.ok) {
            router.push('/dashboard');
        }
    } catch(err) {
        alert("Failed to log meal.");
    }
  };

  return (
    <div className={styles.hero}>
      <h1 className={styles.title}>
        AI Nutrition <br/>
        <span className="heading-gradient">for Indian Cuisine</span>
      </h1>
      <p className={styles.subtitle}>
        Snap a photo of your complex mixed meals. Our AI precisely identifies the dish, decomposes the ingredients, and logs your exact macros.
      </p>

      <div className={styles.uploadContainer}>
        {!previewUrl ? (
          <div className="glass-panel" style={{textAlign: 'center'}}>
            <span className="upload-icon">📸</span>
            <h3 style={{marginBottom: '1.5rem'}}>Add your meal</h3>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexDirection: 'column', sm: {flexDirection: 'row'}}}>
              <button className="btn-primary" onClick={() => cameraInputRef.current.click()} style={{width: '100%', padding: '16px'}}>
                📷 Take Photo
              </button>
              <button className="btn-secondary" onClick={() => fileInputRef.current.click()} style={{width: '100%', padding: '16px'}}>
                📁 Upload from Gallery
              </button>
            </div>
            
            <input 
              type="file" 
              hidden 
              ref={cameraInputRef} 
              accept="image/*" 
              capture="environment"
              onChange={handleImageUpload} 
            />
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        ) : (
          <div className="glass-panel" style={{padding: '1rem'}}>
            <img 
              src={previewUrl} 
              alt="Meal Preview" 
              style={{width: '100%', borderRadius: '16px', maxHeight: '300px', objectFit: 'cover'}} 
            />
            
            {isAnalyzing ? (
              <div style={{textAlign: 'center', padding: '2rem'}}>
                <div className="heading-gradient" style={{fontSize: '1.2rem', fontWeight: '600'}}>
                  Analyzing with Gemini 3.1 Flash Lite...
                </div>
                <p style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}>Decomposing ingredients</p>
              </div>
            ) : error ? (
               <div style={{textAlign: 'center', padding: '2rem', color: 'var(--accent-color)'}}>
                 <p>{error}</p>
                 <button className="btn-secondary" style={{marginTop: '1rem'}} onClick={() => setPreviewUrl(null)}>Try Again</button>
               </div>
            ) : prediction ? (
              <div className={styles.resultsContainer}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h2 style={{fontSize: '1.5rem'}}>{prediction.dish_name}</h2>
                  <span className={styles.macrosBadge}>{(prediction.confidence * 100).toFixed(0)}% Match</span>
                </div>
                
                <div style={{background: 'rgba(255, 142, 83, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '12px', marginTop: '1rem'}}>
                  <p style={{fontSize: '0.9rem', color: '#ff8e53', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span>⚠️</span> We estimated these quantities based on the image. Please verify and adjust them before logging.
                  </p>
                </div>

                <ul className={styles.ingredientList}>
                  {prediction.ingredients.map((ing, idx) => (
                    <li key={idx} className={styles.ingredientItem}>
                      <span style={{fontWeight: '500', flex: 1}}>{ing.name}</span>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                         <input 
                           type="number" 
                           value={ing.amount} 
                           onChange={(e) => handleAmountChange(idx, e.target.value)}
                           style={{width: '60px', background: 'transparent', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', padding: '4px', textAlign: 'right'}}
                         />
                         <span style={{color: 'var(--text-secondary)', width: '30px'}}>{ing.unit}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                  <button className="btn-primary" style={{flex: 1}} onClick={verifyAndLog}>Verify & Log Meal</button>
                  <button className="btn-secondary" onClick={() => setPreviewUrl(null)}>Try Another</button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
