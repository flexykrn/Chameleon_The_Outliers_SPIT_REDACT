# 🌳 View Merkle Tree Generation Process

## What This Script Does

This script fetches your actual attack logs from Firebase and shows you **step-by-step** how they become a single Merkle root hash.

## Setup

### 1. Download Firebase Service Account Key

1. Go to: https://console.firebase.google.com/
2. Select your project: **chameleon-f12ad**
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the file as `firebase-service-account.json`
7. Move it to: `chameleon/firebase-service-account.json`

### 2. Run the Script

```bash
cd chameleon
node scripts/view-merkle-process.js
```

## What You'll See

```
🌳 MERKLE TREE GENERATION PROCESS

══════════════════════════════════════════════════════════════════════

📥 Step 1: Fetching logs from Firebase...

✅ Fetched 10 logs

══════════════════════════════════════════════════════════════════════

🔐 Step 2: Hashing each log individually

Log 1:
  Payload: ' OR 1=1 --
  Classification: SQLi
  IP: 192.168.1.100
  ➜ Hash: a1b2c3d4e5f6...789abc

Log 2:
  Payload: <script>alert(1)</script>
  Classification: XSS
  IP: 192.168.1.101
  ➜ Hash: f6e5d4c3b2a1...fedcba

... (8 more logs)

══════════════════════════════════════════════════════════════════════

🌲 Step 3: Building Merkle Tree

Level 0 (Leaf Hashes): 10 hashes

Level 1:
  Pair 1:
    a1b2c3d4e5f6... + f6e5d4c3b2a1...
    ➜ 1a2b3c4d5e6f...789xyz
  Pair 2:
    c3d4e5f6a1b2... + d4e5f6a1b2c3...
    ➜ 2b3c4d5e6f7a...890abc
  ... (3 more pairs)
  → Next level: 5 hashes

Level 2:
  Pair 1:
    1a2b3c4d5e6f... + 2b3c4d5e6f7a...
    ➜ 3c4d5e6f7a8b...901def
  ... (2 more pairs)
  → Next level: 3 hashes

Level 3:
  Pair 1:
    3c4d5e6f7a8b... + 4d5e6f7a8b9c...
    ➜ 5e6f7a8b9c0d...012ghi
  ... (1 more pair)
  → Next level: 2 hashes

Level 4:
  Pair 1:
    5e6f7a8b9c0d... + 6f7a8b9c0d1e...
    ➜ 7a8b9c0d1e2f...123jkl
  → Next level: 1 hash

══════════════════════════════════════════════════════════════════════

✨ FINAL MERKLE ROOT

🎯 7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d

This 64-character hash represents ALL 10 logs!
Any modification to ANY log will change this root. 🔐

══════════════════════════════════════════════════════════════════════

📦 What Gets Stored on Blockchain:

Batch ID: batch-1700000000000-10
Merkle Root: 0x7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d
Timestamp: 2024-01-15T10:30:00.000Z
Logs Count: 10

✅ Complete! This is exactly how your logs become tamper-proof.
```

## Understanding the Output

### Individual Log Hashes (Level 0)
Each log is hashed independently using SHA-256:
- **Input**: `{payload, classification, confidence, ip, endpoint, timestamp}`
- **Output**: 64-character hex string

### Merkle Tree Levels
The script shows each level of pairing:
- **Level 1**: 10 hashes → 5 pairs → 5 hashes
- **Level 2**: 5 hashes → 3 pairs → 3 hashes
- **Level 3**: 3 hashes → 2 pairs → 2 hashes
- **Level 4**: 2 hashes → 1 pair → **1 MERKLE ROOT**

### Final Result
The last hash IS your Merkle root that gets stored on the blockchain!

## Benefits of This Approach

✅ **Tamper Detection**: Changing ANY log changes the Merkle root  
✅ **Efficient**: Only one hash stored on blockchain for many logs  
✅ **Provable**: Can prove a log was in the batch using Merkle proof  
✅ **Immutable**: Once on blockchain, cannot be changed  

## Troubleshooting

**Error: Cannot find module**
```bash
cd chameleon
npm install firebase-admin
```

**Error: Failed to load service account**
- Make sure `firebase-service-account.json` is in `chameleon/` directory
- Check that the file is valid JSON
- Verify you downloaded the correct key from Firebase Console

**Error: No logs found**
- Make sure you have logs in your Firebase `attacks` collection
- Try triggering some attacks by using the trap page first

## Next Steps

After running this script:
1. You'll understand exactly how hashing works
2. You can see your actual Merkle root
3. This root can be anchored to blockchain
4. Anyone can verify log integrity using this root

---

**Your logs are now cryptographically secured! 🔐🛡️**
