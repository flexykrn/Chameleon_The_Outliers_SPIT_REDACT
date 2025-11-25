import { NextResponse } from 'next/server';
import { db } from '@/app/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateMerkleRoot } from '@/lib/merkle';
import { anchorMerkleRoot, isBlockchainConfigured } from '@/lib/blockchain';

/**
 * API to anchor recent attack logs to blockchain
 * Creates a batch from recent logs and anchors the Merkle root
 */
export async function POST(request) {
  try {
    // Check if blockchain is configured
    if (!isBlockchainConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Blockchain not configured. Set NEXT_PUBLIC_LOG_ANCHOR_CONTRACT and BLOCKCHAIN_PRIVATE_KEY'
      }, { status: 503 });
    }

    const body = await request.json();
    const { batchSize = 10, customBatchId } = body;

    console.log('🔗 Starting blockchain anchoring process...');

    // Fetch recent attack logs from Firebase
    const attacksRef = collection(db, 'attacks');
    const q = query(attacksRef, orderBy('timestamp', 'desc'), limit(batchSize));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No attack logs found to anchor'
      }, { status: 404 });
    }

    // Convert to array of log objects
    const attackLogs = [];
    const logIds = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      attackLogs.push({ id: doc.id, ...data });
      logIds.push(doc.id);
    });

    console.log(`📊 Found ${attackLogs.length} logs to anchor`);

    // Generate Merkle root
    const merkleRoot = generateMerkleRoot(attackLogs);
    console.log(`🌳 Merkle root generated: ${merkleRoot}`);

    // Generate batch ID
    const batchId = customBatchId || `batch-${Date.now()}-${attackLogs.length}`;

    // Anchor to blockchain
    const anchorResult = await anchorMerkleRoot(batchId, merkleRoot);

    if (!anchorResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Blockchain anchoring failed',
        details: anchorResult.error
      }, { status: 500 });
    }

    // Store batch metadata in Firebase
    try {
      const batchMetadata = {
        batchId,
        merkleRoot,
        logCount: attackLogs.length,
        logIds,
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        timestamp: serverTimestamp(),
        timestampISO: new Date().toISOString(),
        status: 'anchored'
      };

      await addDoc(collection(db, 'blockchainBatches'), batchMetadata);
    } catch (firestoreError) {
      console.error('⚠️ Failed to save batch metadata:', firestoreError);
    }

    // Return success with details
    return NextResponse.json({
      success: true,
      message: 'Logs successfully anchored to blockchain',
      batch: {
        batchId,
        merkleRoot,
        logCount: attackLogs.length,
        logIds: attackLogs.map(log => log.id)
      },
      blockchain: {
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        explorerUrl: anchorResult.explorerUrl
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Anchoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Anchoring failed',
      details: error.message
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
