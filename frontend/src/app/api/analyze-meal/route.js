export const maxDuration = 60; // Maximize Vercel Hobby timeout
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getAuth } from 'firebase-admin/auth';
import { customInitApp } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          description: "List of base ingredients and their estimated weights in grams.",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              ingredient: {
                type: SchemaType.STRING,
                description: "The name of the base ingredient (e.g., 'paneer', 'ghee', 'basmati rice'). Use common names.",
              },
              weight_g: {
                type: SchemaType.NUMBER,
                description: "Estimated weight of the ingredient in grams.",
              },
            },
            required: ["ingredient", "weight_g"],
          },
        },
      }
    });

    customInitApp();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing imageBase64 data' }, { status: 400 });
    }

    const mimeType = imageBase64.split(';')[0].split(':')[1];
    const base64Data = imageBase64.split(',')[1];

    const prompt = `Analyze this image of a meal (likely Indian cuisine). Deconstruct it into its raw base ingredients and estimate the weight of each ingredient in grams. Focus on ingredients that contribute significantly to macros (e.g., paneer, oil/ghee, rice, chicken, lentils). Do not include water or trace spices. Return ONLY the JSON array.`;

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    const ingredientsJSON = JSON.parse(responseText);

    return NextResponse.json({ 
        success: true, 
        ingredients: ingredientsJSON,
        userId: decodedToken.uid 
    });

  } catch (error) {
    console.error('Error analyzing meal:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
