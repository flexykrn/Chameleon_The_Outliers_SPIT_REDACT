import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request) {
  try {
    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' }, 
        { status: 400 }
      );
    }

    // Get IP address from headers
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               '10.10.10.10'; // Fallback IP

    console.log('Sending to Render API:', { payload: input, ip_address: ip });

    // Call deployed Render API with correct format
    const response = await fetch('https://chameleon-api-umen.onrender.com/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        payload: input,      // Changed from 'input' to 'payload'
        ip_address: ip       // Added ip_address
      }),
    });

    console.log('Render API response status:', response.status);

    const data = await response.json();
    console.log('Render API response:', data);
    
    // Handle new schema
    if (data.status === 403 || data.analysis) {
      // New schema format
      return NextResponse.json({
        classification: data.analysis?.verdict || 'Unknown',
        confidence: data.analysis?.confidence || 0,
        deceptiveResponse: data.message || 'Authentication failed',
        timestamp: data.timestamp || new Date().toISOString(),
        clientIp: data.client_ip || ip,
        detectedBy: data.analysis?.detected_by || 'Chameleon Model',
        xaiExplanation: data.analysis?.xai_explanation || null,
        endpoint: data.endpoint,
        httpMethod: data.http_method,
        payload: data.payload,
        rawResponse: data
      });
    }
    
    // Fallback for old schema
    return NextResponse.json({
      classification: data.prediction || data.classification || data.label || 'Unknown',
      confidence: data.confidence || data.score || 0,
      deceptiveResponse: data.deceptive_response || data.message || data.error_message || 'Authentication failed',
      timestamp: new Date().toISOString(),
      rawResponse: data
    });

  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { 
        error: 'Classification failed', 
        details: error.message,
        classification: 'Error',
        confidence: 0,
        deceptiveResponse: 'Service temporarily unavailable'
      },
      { status: 500 }
    );
  }
}
