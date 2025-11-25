import hre from "hardhat";

async function main() {
  console.log("Deploying LogAnchor contract...\n");

  const LogAnchor = await hre.ethers.getContractFactory("LogAnchor");
  const contract = await LogAnchor.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`Contract deployed: ${address}`);
  console.log(`\nAdd to .env: CONTRACT_ADDRESS=${address}`);
  console.log(`View: https://hoodi.etherscan.io/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("ERROR: Deployment failed:", error);
    process.exit(1);
  });
