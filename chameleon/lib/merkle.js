/**
 * Merkle Tree Utility for Attack Log Integrity
 * Generates Merkle roots for batches of attack logs to anchor on blockchain
 */

import crypto from 'crypto';

/**
 * Hash a single piece of data using SHA-256
 */
export function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Hash an attack log object into a single hash
 */
export function hashAttackLog(log) {
  // Create deterministic string from log data
  const logString = JSON.stringify({
    payload: log.payload,
    classification: log.classification,
    confidence: log.confidence,
    ip: log.ip,
    endpoint: log.endpoint,
    timestamp: log.timestampISO
  });
  return hashData(logString);
}

/**
 * Build Merkle tree from array of hashes
 * Returns the Merkle root
 */
export function buildMerkleTree(hashes) {
  if (!hashes || hashes.length === 0) {
    throw new Error('No hashes provided for Merkle tree');
  }

  // If single hash, return it as root
  if (hashes.length === 1) {
    return hashes[0];
  }

  // Build tree level by level
  let currentLevel = [...hashes];
  
  while (currentLevel.length > 1) {
    const nextLevel = [];
    
    // Pair up hashes and hash them together
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash pair together
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(hashData(combined));
      } else {
        // Odd one out - duplicate it
        const combined = currentLevel[i] + currentLevel[i];
        nextLevel.push(hashData(combined));
      }
    }
    
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

/**
 * Generate Merkle root from array of attack logs
 */
export function generateMerkleRoot(attackLogs) {
  if (!attackLogs || attackLogs.length === 0) {
    throw new Error('No attack logs provided');
  }

  // Hash each log
  const hashes = attackLogs.map(log => hashAttackLog(log));
  
  // Build Merkle tree and return root
  return buildMerkleTree(hashes);
}

/**
 * Generate Merkle proof for a specific log in the batch
 * Used for verification
 */
export function generateMerkleProof(attackLogs, targetIndex) {
  if (targetIndex < 0 || targetIndex >= attackLogs.length) {
    throw new Error('Invalid target index');
  }

  const hashes = attackLogs.map(log => hashAttackLog(log));
  const proof = [];
  let currentLevel = [...hashes];
  let currentIndex = targetIndex;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    const isRightNode = currentIndex % 2 === 1;
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(hashData(combined));
        
        // Add sibling to proof
        if (i === currentIndex || i + 1 === currentIndex) {
          proof.push({
            hash: isRightNode ? currentLevel[i] : currentLevel[i + 1],
            position: isRightNode ? 'left' : 'right'
          });
        }
      } else {
        const combined = currentLevel[i] + currentLevel[i];
        nextLevel.push(hashData(combined));
      }
    }
    
    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

/**
 * Verify a Merkle proof
 */
export function verifyMerkleProof(leafHash, proof, merkleRoot) {
  let computedHash = leafHash;

  for (const node of proof) {
    if (node.position === 'left') {
      computedHash = hashData(node.hash + computedHash);
    } else {
      computedHash = hashData(computedHash + node.hash);
    }
  }

  return computedHash === merkleRoot;
}
