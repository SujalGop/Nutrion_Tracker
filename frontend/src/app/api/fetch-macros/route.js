export const maxDuration = 60; // Maximize Vercel Hobby timeout
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { customInitApp } from '@/lib/firebase-admin';

async function getFatSecretToken() {
    const creds = Buffer.from(`${process.env.FATSECRET_CLIENT_ID}:${process.env.FATSECRET_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials&scope=basic'
    });
    if (!res.ok) {
        console.error("Failed to get FatSecret token");
        throw new Error("FatSecret Auth Failed");
    }
    const data = await res.json();
    return data.access_token;
}

function parseFoodDescription(desc) {
    // Example: "Per 100g - Calories: 296kcal | Fat: 25.00g | Carbs: 3.40g | Protein: 14.00g"
    const macros = { kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, base_weight_g: 100 };
    
    const calMatch = desc.match(/Calories:\s*(\d+)kcal/i);
    const fatMatch = desc.match(/Fat:\s*([\d.]+)g/i);
    const carbsMatch = desc.match(/Carbs:\s*([\d.]+)g/i);
    const proteinMatch = desc.match(/Protein:\s*([\d.]+)g/i);

    if (calMatch) macros.kcal = parseFloat(calMatch[1]);
    if (fatMatch) macros.fat_g = parseFloat(fatMatch[1]);
    if (carbsMatch) macros.carbs_g = parseFloat(carbsMatch[1]);
    if (proteinMatch) macros.protein_g = parseFloat(proteinMatch[1]);

    // Check if base weight is something else
    const weightMatch = desc.match(/Per\s*([\d.]+)g/i);
    if (weightMatch) {
       macros.base_weight_g = parseFloat(weightMatch[1]);
    } else {
       // Check if it's "Per 1 serving" or similar
       macros.base_weight_g = 100; // fallback default
    }

    return macros;
}

export async function POST(request) {
  try {
    customInitApp();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    const { ingredients } = await request.json();
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ error: 'Missing or invalid ingredients array' }, { status: 400 });
    }

    const db = getFirestore();
    const cacheRef = db.collection('global_ingredient_cache');
    const macrosResults = [];
    let fatSecretToken = null;
    
    for (const item of ingredients) {
        const normalizedName = item.ingredient.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        let baseMacros = null;

        // 1. Check Firestore Cache
        const docSnap = await cacheRef.doc(normalizedName).get();
        if (docSnap.exists) {
            baseMacros = docSnap.data().macros_per_base_weight;
            baseMacros.base_weight_g = docSnap.data().base_weight_g;
        } else {
            // 2. Fetch from FatSecret if not in cache
            if (!fatSecretToken) {
                fatSecretToken = await getFatSecretToken();
            }

            const searchRes = await fetch(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(item.ingredient)}&format=json&max_results=1`, {
                headers: { 'Authorization': `Bearer ${fatSecretToken}` }
            });
            const searchData = await searchRes.json();
            
            const foodItem = searchData?.foods?.food;
            let foodData = Array.isArray(foodItem) ? foodItem[0] : foodItem;

            if (foodData && foodData.food_description) {
                baseMacros = parseFoodDescription(foodData.food_description);
                
                // Save to cache
                await cacheRef.doc(normalizedName).set({
                    ingredient_name: item.ingredient,
                    base_weight_g: baseMacros.base_weight_g,
                    macros_per_base_weight: {
                        kcal: baseMacros.kcal,
                        protein_g: baseMacros.protein_g,
                        carbs_g: baseMacros.carbs_g,
                        fat_g: baseMacros.fat_g
                    },
                    fatsecret_id: foodData.food_id,
                    last_updated: new Date()
                });
            } else {
                // Fallback zeroed macros if completely unfound
                baseMacros = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, base_weight_g: 100 };
            }
        }

        // 3. Scale based on user weight
        const scale = item.weight_g / baseMacros.base_weight_g;
        macrosResults.push({
            ingredient: item.ingredient,
            weight_g: item.weight_g,
            macros: { 
                kcal: Math.round(baseMacros.kcal * scale), 
                protein_g: Number((baseMacros.protein_g * scale).toFixed(1)), 
                carbs_g: Number((baseMacros.carbs_g * scale).toFixed(1)), 
                fat_g: Number((baseMacros.fat_g * scale).toFixed(1))
            }
        });
    }

    return NextResponse.json({ 
        success: true, 
        data: macrosResults,
        userId: decodedToken.uid 
    });

  } catch (error) {
    console.error('Error fetching macros:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
