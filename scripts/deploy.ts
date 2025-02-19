import { ethers } from "hardhat";

async function main() {
  // Deploy TestToken first
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy(
    "Test Token",
    "TEST",
    ethers.parseEther("1000000") // 1 million tokens
  );
  await testToken.waitForDeployment();
  console.log(`TestToken deployed to: ${testToken.target}`);

  // Deploy ReverseDutchAuctionSwap
  const ReverseDutchAuctionSwap = await ethers.getContractFactory("ReverseDutchAuctionSwap");
  const auction = await ReverseDutchAuctionSwap.deploy();
  await auction.waitForDeployment();
  console.log(`ReverseDutchAuctionSwap deployed to: ${auction.target}`);

  // Save the contract addresses for later use
  const addresses = {
    testToken: testToken.target,
    auction: auction.target,
  };
  console.log("Contract addresses:", addresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });