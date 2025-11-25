import pkg from 'hardhat';
const { ethers } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🧪 Testing LogAnchor Contract");
    console.log("=====================================\n");

    // 1. Get contract address from .env
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
        console.log("❌ CONTRACT_ADDRESS not set in .env file");
        console.log("\n💡 Deploy the contract first:");
        console.log("   npx hardhat run scripts/deploy.js --network hoodi");
        return;
    }

    console.log(`📍 Contract Address: ${contractAddress}\n`);

    // 2. Connect to contract
    const LogAnchor = await ethers.getContractFactory("LogAnchor");
    const contract = LogAnchor.attach(contractAddress);

    const batchId = "test_batch_" + Date.now();
    const testMerkleRoot = ethers.randomBytes(32);
    
    console.log(`Batch ID: ${batchId}`);
    console.log(`Merkle Root: ${ethers.hexlify(testMerkleRoot)}`);
    console.log("\nAnchoring...\n");
    
    try {
        const tx = await contract.anchorRoot(batchId, testMerkleRoot);
        console.log(`TX: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`Block: ${receipt.blockNumber}`);

        const stored = await contract.verifyBatch(batchId);
        console.log(`\nVerified: ${stored.merkleRoot}`);
        console.log(`Timestamp: ${new Date(Number(stored.timestamp) * 1000).toISOString()}`);
        console.log(`Explorer: https://hoodi.etherscan.io/tx/${tx.hash}`);

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
