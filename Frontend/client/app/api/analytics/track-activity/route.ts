import { NextResponse } from 'next/server';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gigId, mouseMoves, keyPresses, clicks, visitorId, timestamp } = body;

    console.log('📊 Activity tracking received:', { gigId, mouseMoves, keyPresses, timestamp });

    if (!gigId) {
      console.error('❌ Missing gigId');
      return NextResponse.json({ success: false, error: 'Gig ID is required' }, { status: 400 });
    }

    // Validate data types
    if (typeof mouseMoves !== 'number' || typeof keyPresses !== 'number' || typeof clicks !== 'number' || !visitorId) {
      console.error('❌ Invalid data types:', { mouseMoves, keyPresses });
      return NextResponse.json({ 
        success: false, 
        error: 'mouseMoves and keyPresses must be numbers' 
      }, { status: 400 });
    }

    console.log('🔄 Forwarding to backend API:', BACKEND_API);

    // Forward to backend Express server which already has working MongoDB connection
    const response = await fetch(`${BACKEND_API}/api/analytics/track-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gigId,
        mouseMoves,
        keyPresses,
        clicks,
        visitorId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Backend API error:', data);
      throw new Error(data.error || 'Backend API failed');
    }

    console.log('✅ Activity tracked successfully via backend');

    return NextResponse.json({ 
      success: true,
      data: data.data || data
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to track activity',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
