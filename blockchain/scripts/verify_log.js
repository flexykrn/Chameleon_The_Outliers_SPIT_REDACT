import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pkg from 'hardhat';
const { ethers } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class MerkleVerifier {
    static hashLeaf(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest();
    }

    static verify(logEntry, proof, onChainRoot) {
        let hash = this.hashLeaf(logEntry);

        // Reconstruct root by applying proof
        for (const sibling of proof) {
            const siblingBuffer = Buffer.from(sibling.hash.slice(2), 'hex');
            
            if (sibling.position === 'left') {
                hash = crypto.createHash('sha256')
                    .update(Buffer.concat([siblingBuffer, hash]))
                    .digest();
            } else {
                hash = crypto.createHash('sha256')
                    .update(Buffer.concat([hash, siblingBuffer]))
                    .digest();
            }
        }

        const computedRoot = '0x' + hash.toString('hex');
        const onChainRootClean = onChainRoot.toLowerCase();
        
        return computedRoot.toLowerCase() === onChainRootClean;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        throw new Error("Usage: npx hardhat run scripts/verify_log.js --network hoodi <event_id>");
    }

    const eventId = args[0];
    console.log(`Verifying: ${eventId}\n`);

    const logsDir = path.join(__dirname, '..', '..', 'backend', 'security_logs');
    
    if (!fs.existsSync(logsDir)) {
        throw new Error("Logs directory not found");
    }

    const proofFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('_proofs.json'));

    if (proofFiles.length === 0) {
        throw new Error("No proof files found. Run anchor_logs.js first.");
    }

    let batchId = null;
    let logProof = null;
    let logEntry = null;


    for (const proofFile of proofFiles) {
        const proofPath = path.join(logsDir, proofFile);
        const proofs = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
        
        const found = proofs.find(p => p.event_id === eventId);
        if (found) {
            batchId = proofFile.replace('_proofs.json', '');
            logProof = found;
            break;
        }
    }

    if (!logProof) {
        throw new Error(`Log ${eventId} not found in any anchored batch`);
    }

    console.log(`Found in batch: ${batchId}`);


    const metadataPath = path.join(logsDir, `${batchId}_anchor.json`);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    const logFilePath = path.join(logsDir, metadata.sourceFile);
    const logContent = fs.readFileSync(logFilePath, 'utf-8');
    const logs = logContent.trim().split('\n').map(line => JSON.parse(line));
    
    logEntry = logs.find(log => log.event_id === eventId);

    if (!logEntry) {
        throw new Error("Original log entry not found");
    }

    console.log(`IP: ${logEntry.client.ip}`);
    console.log(`Verdict: ${logEntry.security_analysis.verdict}`);
    console.log(`Timestamp: ${logEntry.timestamp}`);

    // 3. Get on-chain root
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.log("❌ CONTRACT_ADDRESS not set in .env");
        return;
    }

    const LogAnchor = await ethers.getContractFactory("LogAnchor");
    const contract = LogAnchor.attach(contractAddress);

    console.log("⛓️  On-Chain Data:");
    console.log("-------------------------------------");
    
    const stored = await contract.verifyBatch(batchId);
    const onChainRoot = stored.merkleRoot;

    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Merkle Root: ${onChainRoot}`);
    console.log(`   Block Time: ${new Date(Number(stored.timestamp) * 1000).toISOString()}`);
    console.log(`   Committer: ${stored.committer}`);
    console.log(`   Transaction: ${metadata.transactionHash}`);
    console.log();

    // 4. Verify the log
    console.log("🔐 Verifying Merkle Proof...");
    console.log("-------------------------------------");
    
    const isValid = MerkleVerifier.verify(logEntry, logProof.proof, onChainRoot);

    console.log();
    if (isValid) {
        console.log("VERIFIED: Log is authentic and untampered");
        console.log(`Explorer: ${metadata.explorerUrl}`);
    } else {
        console.log("FAILED: Log may have been tampered!");
        console.log("Computed root does NOT match on-chain root");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("ERROR:", error);
        process.exit(1);
    });
