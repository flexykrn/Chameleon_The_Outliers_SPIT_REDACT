import { NextResponse } from 'next/server';
import { db } from '@/app/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Get recent blockchain batches
 * Returns list of batches that have been anchored
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '10');

    // Fetch recent batches from Firebase
    const batchesRef = collection(db, 'blockchainBatches');
    const q = query(batchesRef, orderBy('timestamp', 'desc'), limit(limitParam));
    const snapshot = await getDocs(q);

    const batches = [];
    snapshot.forEach(doc => {
      batches.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({
      success: true,
      batches,
      count: batches.length
    });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
