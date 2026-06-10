import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Type } from '@google/generative-ai';
import { getAuth } from 'firebase-admin/auth';
import { customInitApp } from '@/lib/firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite',
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      description: "List of base ingredients and their estimated weights in grams.",
      items: {
        type: Type.OBJECT,
        properties: {
          ingredient: {
            type: Type.STRING,
            description: "The name of the base ingredient (e.g., 'paneer', 'ghee', 'basmati rice'). Use common names.",
          },
          weight_g: {
            type: Type.NUMBER,
            description: "Estimated weight of the ingredient in grams.",
          },
        },
        required: ["ingredient", "weight_g"],
      },
    },
  }
});

export async function POST(request) {
  try {
    customInitApp();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
        throw new Error("Failed to fetch image from URL");
    }
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    const prompt = `Analyze this image of a meal (likely Indian cuisine). Deconstruct it into its raw base ingredients and estimate the weight of each ingredient in grams. Focus on ingredients that contribute significantly to macros (e.g., paneer, oil/ghee, rice, chicken, lentils). Do not include water or trace spices. Return ONLY the JSON array.`;

    const imagePart = {
        inlineData: {
            data: base64Image,
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
