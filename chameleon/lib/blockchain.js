/**
 * Blockchain Integration Service
 * Anchors attack log Merkle roots to blockchain for tamper-proof verification
 */

import { ethers } from 'ethers';

// LogAnchor Contract ABI
const LOG_ANCHOR_ABI = [
  "function anchorRoot(string calldata batchId, bytes32 merkleRoot) external",
  "function verifyBatch(string calldata batchId) external view returns (bytes32 merkleRoot, uint256 timestamp, address committer)",
  "event LogBatchAnchored(string indexed batchId, bytes32 merkleRoot, uint256 timestamp, address indexed committer)"
];

// Contract address (update after deployment)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOG_ANCHOR_CONTRACT || "";

// Network configuration
const RPC_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC || "https://rpc.hoodi.ethpandaops.io";
const CHAIN_ID = 560048; // Hoodi testnet

/**
 * Get blockchain provider
 */
function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

/**
 * Get contract instance (read-only)
 */
function getContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, LOG_ANCHOR_ABI, provider);
}

/**
 * Get contract instance with signer (for writing)
 */
function getContractWithSigner() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
    throw new Error('Blockchain private key not configured');
  }

  const provider = getProvider();
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, LOG_ANCHOR_ABI, wallet);
}

/**
 * Anchor a Merkle root to the blockchain
 * @param {string} batchId - Unique identifier for this batch (e.g., date-timestamp)
 * @param {string} merkleRoot - Hex string of Merkle root (with 0x prefix)
 * @returns {Promise<Object>} Transaction receipt
 */
export async function anchorMerkleRoot(batchId, merkleRoot) {
  try {
    // Ensure merkleRoot is properly formatted as bytes32
    const formattedRoot = merkleRoot.startsWith('0x') ? merkleRoot : `0x${merkleRoot}`;
    
    // Get contract with signer
    const contract = getContractWithSigner();
    
    // Send transaction
    console.log(`📤 Anchoring batch ${batchId} to blockchain...`);
    const tx = await contract.anchorRoot(batchId, formattedRoot);
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    
    console.log(`✅ Batch anchored in block ${receipt.blockNumber}`);
    
    return {
      success: true,
      batchId,
      merkleRoot: formattedRoot,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      explorerUrl: `https://hoodi.etherscan.io/tx/${tx.hash}`
    };
  } catch (error) {
    console.error('❌ Blockchain anchoring failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify a batch on the blockchain
 * @param {string} batchId - Batch identifier to verify
 * @returns {Promise<Object>} Batch information from blockchain
 */
export async function verifyBatchOnChain(batchId) {
  try {
    const contract = getContract();
    
    const [merkleRoot, timestamp, committer] = await contract.verifyBatch(batchId);
    
    return {
      success: true,
      batchId,
      merkleRoot,
      timestamp: Number(timestamp),
      timestampISO: new Date(Number(timestamp) * 1000).toISOString(),
      committer,
      verified: true
    };
  } catch (error) {
    console.error('❌ Blockchain verification failed:', error);
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
}

/**
 * Check if contract is configured
 */
export function isBlockchainConfigured() {
  return !!(CONTRACT_ADDRESS && process.env.BLOCKCHAIN_PRIVATE_KEY);
}

/**
 * Get blockchain explorer URL for a transaction
 */
export function getExplorerUrl(txHash) {
  return `https://hoodi.etherscan.io/tx/${txHash}`;
}

/**
 * Get blockchain explorer URL for the contract
 */
export function getContractExplorerUrl() {
  return `https://hoodi.etherscan.io/address/${CONTRACT_ADDRESS}`;
}
