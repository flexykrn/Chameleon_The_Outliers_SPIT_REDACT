# 🔗 Blockchain Configuration for Log Anchoring

## Required Environment Variables

Add these to your `.env.local` file:

```env
# LogAnchor Smart Contract Address (after deployment)
NEXT_PUBLIC_LOG_ANCHOR_CONTRACT=0x...

# Blockchain RPC URL (Hoodi testnet)
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://rpc.hoodi.ethpandaops.io

# Private key for signing blockchain transactions
# ⚠️ NEVER commit this to git! Keep it secret!
BLOCKCHAIN_PRIVATE_KEY=0x...
```

## Deployment Steps

### 1. Deploy the Smart Contract

```bash
cd blockchain
npm install
npx hardhat run scripts/deploy.js --network hoodi
```

Save the deployed contract address.

### 2. Update Environment Variables

Copy the contract address to `.env.local`:
```env
NEXT_PUBLIC_LOG_ANCHOR_CONTRACT=0xYourContractAddressHere
```

### 3. Test the Integration

```bash
cd ../chameleon
npm install ethers
npm run dev
```

## Usage

### Automatic Anchoring (Recommended)

The system will automatically anchor logs in batches. Configure in your app:

```javascript
// Anchor every 10 logs
// Call POST /api/anchor-logs
```

### Manual Anchoring

```bash
curl -X POST http://localhost:3000/api/anchor-logs \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

### Verify a Batch

```bash
curl -X POST http://localhost:3000/api/verify-batch \
  -H "Content-Type: application/json" \
  -d '{"batchId": "batch-1234567890-10"}'
```

## How It Works

1. **Attack Logged** → Saved to Firebase
2. **Batch Created** → Every N logs, create a batch
3. **Merkle Root Generated** → Hash all logs in batch using SHA-256 Merkle tree
4. **Anchor to Blockchain** → Store Merkle root in smart contract
5. **Immutable Proof** → Logs can be verified against blockchain

## Verification Process

```
Attack Log → Hash → Merkle Tree → Merkle Root → Blockchain
                                                       ↓
                                            [Tamper-Proof Record]
```

Any modification to the logs will result in a different Merkle root, proving tampering.

## Contract Explorer

View your contract and transactions:
- **Hoodi Explorer**: https://hoodi.etherscan.io/address/YOUR_CONTRACT_ADDRESS

## Security Notes

- ✅ Merkle roots are immutable once anchored
- ✅ Blockchain timestamp proves when logs were created
- ✅ Cannot delete or modify anchored batches
- ⚠️ Keep `BLOCKCHAIN_PRIVATE_KEY` secure
- ⚠️ Never expose private key in client-side code
