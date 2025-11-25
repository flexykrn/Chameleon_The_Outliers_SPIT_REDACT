import { NextResponse } from 'next/server';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { headers } from 'next/headers';

/**
 * Analyze attack payload using Google Gemini API
 * Returns a concise explanation of the attack intention
 */
async function analyzePayloadWithGemini(payload, classification) {
  const GEMINI_API_KEY = 'AIzaSyDSx4YJyLuDs9zyAAu8lX5nYdVm52LwPkk';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
  
  try {
    const prompt = `Analyze this ${classification} attack payload and provide ONE concise sentence (max 120 chars) explaining what the attacker was trying to do. Include a security reference link.

Payload: "${payload}"

Format: "Brief explanation [Link: URL]"
Example: "Bypassing auth with SQL OR 1=1 logic [Link: https://owasp.org/www-community/attacks/SQL_Injection]"`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 80,
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    console.log('✅ Gemini Analysis:', analysis);
    return analysis || null;

  } catch (error) {
    console.error('❌ Gemini analysis failed:', error.message);
    return null;
  }
}

export async function POST(request) {
  console.log('🔥 LOG-ATTACK API CALLED');
  try {
    const body = await request.json();
    console.log('📦 Received body:', JSON.stringify(body, null, 2));
    
    const { 
      input, 
      classification, 
      confidence, 
      deceptiveResponse,
      clientIp,
      detectedBy,
      xaiExplanation,
      endpoint,
      httpMethod,
      payload
    } = body;
    
    const headersList = await headers();
    
    // Get IP address from headers or use clientIp from response
    const ip = clientIp || 
               headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown';

    // Get GeoIP data
    let geoData = { 
      country_name: 'Unknown', 
      city: 'Unknown', 
      latitude: 0, 
      longitude: 0,
      region: 'Unknown',
      timezone: 'Unknown'
    };
    
    if (ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: {
            'User-Agent': 'Chameleon-Security-System/1.0'
          }
        });
        
        if (geoResponse.ok) {
          const geoJson = await geoResponse.json();
          if (!geoJson.error) {
            // Hardcode: If location is Pune, change it to Mumbai
            let cityName = geoJson.city || 'Unknown';
            if (cityName.toLowerCase() === 'pune') {
              cityName = 'Mumbai';
            }
            
            geoData = {
              country_name: geoJson.country_name || 'Unknown',
              city: cityName,
              latitude: geoJson.latitude || 0,
              longitude: geoJson.longitude || 0,
              region: geoJson.region || 'Unknown',
              timezone: geoJson.timezone || 'Unknown'
            };
          }
        }
      } catch (error) {
        console.error('GeoIP lookup failed:', error);
        // Continue with default values
      }
    }

    // 🤖 Analyze attack payload with Gemini AI (only for malicious classifications)
    let geminiAnalysis = null;
    const attackPayload = payload || input;
    const isMalicious = classification && 
                       classification.toLowerCase() !== 'benign' && 
                       classification.toLowerCase() !== 'safe';
    
    if (isMalicious && attackPayload) {
      console.log('🤖 Analyzing payload with Gemini AI...');
      geminiAnalysis = await analyzePayloadWithGemini(attackPayload, classification);
    }

    // Create attack log document with new schema
    const attackLog = {
      // Basic info
      input: input || payload,
      payload: payload || input,
      classification: classification,
      verdict: classification, // alias for new schema
      confidence: parseFloat(confidence) || 0,
      deceptiveResponse: deceptiveResponse,
      message: deceptiveResponse, // alias for new schema
      
      // Detection info
      detectedBy: detectedBy || 'Chameleon Model',
      
      // XAI Explanation (if available)
      xaiExplanation: xaiExplanation || null,
      
      // 🤖 Gemini AI Analysis (new field)
      geminiAnalysis: geminiAnalysis || null,
      attackIntention: geminiAnalysis || null, // alias for easier access
      
      // Network info
      ip: ip,
      clientIp: ip, // alias for new schema
      country: geoData.country_name,
      city: geoData.city,
      region: geoData.region,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      timezone: geoData.timezone,
      
      // Request info
      endpoint: endpoint || '/trap',
      httpMethod: httpMethod || 'POST',
      userAgent: headersList.get('user-agent') || 'Unknown',
      referer: headersList.get('referer') || 'Direct',
      
      // Timestamp
      timestamp: serverTimestamp(),
      timestampISO: new Date().toISOString()
    };

    // Save to Firestore
    console.log('💾 Attempting to save to Firestore...');
    console.log('📄 Attack log data:', JSON.stringify(attackLog, null, 2));
    
    const docRef = await addDoc(collection(db, 'attacks'), attackLog);
    
    console.log('✅ Successfully saved to Firestore! Doc ID:', docRef.id);

    return NextResponse.json({ 
      success: true, 
      attackId: docRef.id,
      message: 'Attack logged successfully' 
    });

  } catch (error) {
    console.error('❌ Logging error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Logging failed', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
