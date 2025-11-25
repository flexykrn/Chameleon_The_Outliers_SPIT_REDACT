import { NextResponse } from 'next/server';
import { verifyBatchOnChain, isBlockchainConfigured } from '@/lib/blockchain';

/**
 * API to verify a batch on the blockchain
 * Checks if a batch ID exists and returns its Merkle root and metadata
 */
export async function POST(request) {
  try {
    if (!isBlockchainConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Blockchain not configured'
      }, { status: 503 });
    }

    const body = await request.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({
        success: false,
        error: 'batchId is required'
      }, { status: 400 });
    }

    console.log(`🔍 Verifying batch: ${batchId}`);

    const verificationResult = await verifyBatchOnChain(batchId);

    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: verificationResult.error
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      batch: {
        batchId,
        merkleRoot: verificationResult.merkleRoot,
        timestamp: verificationResult.timestamp,
        timestampISO: verificationResult.timestampISO,
        committer: verificationResult.committer
      },
      message: 'Batch verified on blockchain - logs are tamper-proof'
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return NextResponse.json({
      success: false,
      verified: false,
      error: error.message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
