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

class MerkleTree {
    constructor(leaves) {
        this.leaves = leaves.map(l => this.hashLeaf(l));
        this.layers = [this.leaves];
        this.buildTree();
    }

    hashLeaf(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest();
    }

    buildTree() {
        while (this.layers[this.layers.length - 1].length > 1) {
            const currentLayer = this.layers[this.layers.length - 1];
            const nextLayer = [];
            
            for (let i = 0; i < currentLayer.length; i += 2) {
                if (i + 1 < currentLayer.length) {
                    const combined = Buffer.concat([currentLayer[i], currentLayer[i + 1]]);
                    nextLayer.push(crypto.createHash('sha256').update(combined).digest());
                } else {
                    nextLayer.push(currentLayer[i]);
                }
            }
            
            this.layers.push(nextLayer);
        }
    }

    getRoot() {
        return this.layers[this.layers.length - 1][0];
    }

    getProof(index) {
        const proof = [];
        let currentIndex = index;
        
        for (let level = 0; level < this.layers.length - 1; level++) {
            const isRightNode = currentIndex % 2 === 1;
            const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
            
            if (siblingIndex < this.layers[level].length) {
                proof.push({
                    hash: '0x' + this.layers[level][siblingIndex].toString('hex'),
                    position: isRightNode ? 'left' : 'right'
                });
            }
            
            currentIndex = Math.floor(currentIndex / 2);
        }
        
        return proof;
    }
}

async function main() {
    console.log("🔐 Chameleon Log Anchoring System");
    console.log("=====================================\n");

    // 1. Read logs from backend
    const logsDir = path.join(__dirname, '..', '..', 'backend', 'security_logs');
    
    if (!fs.existsSync(logsDir)) {
        console.log("❌ Security logs directory not found");
        console.log("📁 Expected path:", logsDir);
        console.log("\n💡 Make sure your FastAPI backend has generated logs first");
        return;
    }

    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.jsonl'));
    
    if (logFiles.length === 0) {
        throw new Error("No log files found");
    }

    const latestFile = logFiles.sort().pop();
    const logPath = path.join(logsDir, latestFile);
    
    console.log(`Processing: ${latestFile}`);

    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs = logContent
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

    console.log(`Logs: ${logs.length}`);

    if (logs.length === 0) {
        throw new Error("No logs to process");
    }

    const tree = new MerkleTree(logs);
    const merkleRoot = tree.getRoot();
    const merkleRootHex = '0x' + merkleRoot.toString('hex');
    
    console.log(`Merkle Root: ${merkleRootHex}`);

    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS not set in .env");
    }

    const LogAnchor = await ethers.getContractFactory("LogAnchor");
    const contract = LogAnchor.attach(contractAddress);

    const batchId = `batch_${Date.now()}`;
    
    console.log(`Batch: ${batchId}`);
    console.log("\nAnchoring...");
    
    try {
        const tx = await contract.anchorRoot(batchId, merkleRoot);
        console.log(`TX: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`Block: ${receipt.blockNumber}\n`);


        const metadata = {
            batchId,
            merkleRoot: merkleRootHex,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            timestamp: new Date().toISOString(),
            logCount: logs.length,
            sourceFile: latestFile,
            contractAddress: contractAddress,
            network: "hoodi",
            explorerUrl: `https://hoodi.etherscan.io/tx/${tx.hash}`
        };

        const metadataFile = path.join(logsDir, `${batchId}_anchor.json`);
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

        const proofs = logs.map((log, index) => ({
            event_id: log.event_id,
            leaf_hash: '0x' + tree.leaves[index].toString('hex'),
            proof: tree.getProof(index)
        }));
        
        const proofsFile = path.join(logsDir, `${batchId}_proofs.json`);
        fs.writeFileSync(proofsFile, JSON.stringify(proofs, null, 2));

        console.log(`Saved: ${batchId}_anchor.json`);
        console.log(`Saved: ${batchId}_proofs.json`);
        console.log(`\nExplorer: ${metadata.explorerUrl}`);

    } catch (error) {
        console.error("ERROR:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("ERROR:", error);
        process.exit(1);
    });
