const { ethers } = require("hardhat");

async function main() {
  console.log("🔐 Generating new Ethereum wallet...\n");
  
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log("✅ New wallet generated!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Address:", wallet.address);
  console.log("🔑 Private Key:", wallet.privateKey);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
  console.log("   1. Save this private key in a secure location!");
  console.log("   2. NEVER share it with anyone!");
  console.log("   3. NEVER commit it to git!");
  console.log("   4. Add it to your .env.local files:");
  console.log(`      BLOCKCHAIN_PRIVATE_KEY=${wallet.privateKey}`);
  console.log("\n💰 Fund this address:");
  console.log("   1. Copy the address above");
  console.log("   2. Get Hoodi testnet ETH from a faucet");
  console.log("   3. Send some test ETH to this address");
  console.log("   4. Then run: npm run deploy");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
