/**
 * View Merkle Tree Generation Process
 * Run this to see how your logs become a Merkle root
 * 
 * Usage: node scripts/view-merkle-process.js
 */

import crypto from 'crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccountPath = join(__dirname, '../firebase-service-account.json');
// You'll need to download this from Firebase Console

// Helper: Hash data
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper: Hash attack log
function hashAttackLog(log) {
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

// Main function
async function viewMerkleProcess() {
  console.log('🌳 MERKLE TREE GENERATION PROCESS\n');
  console.log('═'.repeat(70));
  
  try {
    // Initialize Firebase
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore();
    
    // Fetch recent logs
    console.log('\n📥 Step 1: Fetching logs from Firebase...\n');
    const logsSnapshot = await db.collection('attacks')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const logs = [];
    logsSnapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        payload: data.payload,
        classification: data.classification,
        confidence: data.confidence,
        ip: data.ip,
        endpoint: data.endpoint,
        timestampISO: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    
    console.log(`✅ Fetched ${logs.length} logs\n`);
    
    // Step 2: Hash each log
    console.log('═'.repeat(70));
    console.log('\n🔐 Step 2: Hashing each log individually\n');
    
    const hashes = logs.map((log, index) => {
      const hash = hashAttackLog(log);
      console.log(`Log ${index + 1}:`);
      console.log(`  Payload: ${log.payload.substring(0, 50)}...`);
      console.log(`  Classification: ${log.classification}`);
      console.log(`  IP: ${log.ip}`);
      console.log(`  ➜ Hash: ${hash.substring(0, 16)}...${hash.substring(48)}`);
      console.log('');
      return hash;
    });
    
    // Step 3: Build Merkle tree
    console.log('═'.repeat(70));
    console.log('\n🌲 Step 3: Building Merkle Tree\n');
    
    let currentLevel = [...hashes];
    let levelNum = 0;
    
    console.log(`Level ${levelNum} (Leaf Hashes): ${currentLevel.length} hashes\n`);
    
    while (currentLevel.length > 1) {
      levelNum++;
      const nextLevel = [];
      
      console.log(`Level ${levelNum}:`);
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const combined = currentLevel[i] + currentLevel[i + 1];
          const newHash = hashData(combined);
          nextLevel.push(newHash);
          
          console.log(`  Pair ${Math.floor(i/2) + 1}:`);
          console.log(`    ${currentLevel[i].substring(0, 12)}... + ${currentLevel[i+1].substring(0, 12)}...`);
          console.log(`    ➜ ${newHash.substring(0, 16)}...${newHash.substring(48)}`);
        } else {
          const combined = currentLevel[i] + currentLevel[i];
          const newHash = hashData(combined);
          nextLevel.push(newHash);
          
          console.log(`  Single ${Math.floor(i/2) + 1}:`);
          console.log(`    ${currentLevel[i].substring(0, 12)}... (duplicated)`);
          console.log(`    ➜ ${newHash.substring(0, 16)}...${newHash.substring(48)}`);
        }
      }
      
      console.log(`  → Next level: ${nextLevel.length} hashes\n`);
      currentLevel = nextLevel;
    }
    
    // Final Merkle Root
    const merkleRoot = currentLevel[0];
    
    console.log('═'.repeat(70));
    console.log('\n✨ FINAL MERKLE ROOT\n');
    console.log(`🎯 ${merkleRoot}`);
    console.log('\nThis 64-character hash represents ALL 10 logs!');
    console.log('Any modification to ANY log will change this root. 🔐\n');
    console.log('═'.repeat(70));
    
    // Show what gets stored on blockchain
    console.log('\n📦 What Gets Stored on Blockchain:\n');
    console.log(`Batch ID: batch-${Date.now()}-${logs.length}`);
    console.log(`Merkle Root: 0x${merkleRoot}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Logs Count: ${logs.length}`);
    console.log('\n✅ Complete! This is exactly how your logs become tamper-proof.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Download firebase-service-account.json from Firebase Console');
    console.log('2. Place it in chameleon/ directory');
    console.log('3. Have some logs in your Firebase attacks collection');
  }
}

// Run it
viewMerkleProcess();
