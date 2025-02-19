import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const TEST_TOKEN_ADDRESS = "0xD2A4222BF8A38E52aA849D9D5e6559D503B1CCE9";
const AUCTION_ADDRESS = "0x6502E4081EB53b41703F8C63c1Fe4CD65feF6E25";

const TOKEN_AMOUNT = ethers.parseEther("0.1");  
const START_PRICE = ethers.parseEther("0.001");    
const END_PRICE = ethers.parseEther("0.0001");
const DURATION = 3600;      

async function simulateAuction() {
  console.log("\n=== Starting Auction Simulation ===");
  
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);
  const auction = await ethers.getContractAt("ReverseDutchAuctionSwap", AUCTION_ADDRESS);

  // Get the primary signer
  const [owner] = await ethers.getSigners();
  
  // Create new wallets
  const seller = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)), ethers.provider);
  const buyer = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)), ethers.provider);

  // Fund the new wallets with minimal ETH for gas
  const tx1 = await owner.sendTransaction({
    to: seller.address,
    value: ethers.parseEther("0.0005")
  });
  await tx1.wait();  // Wait for first transaction

  const tx2 = await owner.sendTransaction({
    to: buyer.address,
    value: ethers.parseEther("0.001")
  });
  await tx2.wait();  // Wait for second transaction

  console.log("Owner address:", owner.address);
  console.log("Seller address:", seller.address);
  console.log("Buyer address:", buyer.address);

  console.log("\nTransferring tokens to seller...");
  const transferTx = await testToken.transfer(seller.address, TOKEN_AMOUNT);
  await transferTx.wait();  // Wait for token transfer
  console.log("Seller token balance:", await testToken.balanceOf(seller.address));

  console.log("\nApproving auction contract...");
  const approveTx = await testToken.connect(seller).approve(auction.target, TOKEN_AMOUNT);
  await approveTx.wait();  // Wait for approval
  console.log("Approval completed");


  console.log("\nCreating auction...");
  const createTx = await auction.connect(seller).createAuction(
    testToken.target,
    TOKEN_AMOUNT,
    START_PRICE,
    END_PRICE,
    DURATION
  );
  await createTx.wait();
  console.log("Auction created");

  // Get initial price
  const auctionId = 0;
  const initialPrice = await auction.getCurrentPrice(auctionId);
  console.log("\nInitial price:", ethers.formatEther(initialPrice), "ETH");

  console.log("\nAdvancing time by 15 minutes...");
  await time.increase(900);

  const midPrice = await auction.getCurrentPrice(auctionId);
  console.log("Price after 15 minutes:", ethers.formatEther(midPrice), "ETH");

  console.log("\nExecuting swap...");
  const swapTx = await auction.connect(buyer).executeSwap(auctionId, {
    value: midPrice
  });
  await swapTx.wait();

  const buyerTokenBalance = await testToken.balanceOf(buyer.address);
  console.log("\nFinal buyer token balance:", ethers.formatEther(buyerTokenBalance));
}

async function checkPriceIntervals() {
  console.log("\n=== Checking Price Intervals ===");
  

  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);
  const auction = await ethers.getContractAt("ReverseDutchAuctionSwap", AUCTION_ADDRESS);

  const [owner, seller] = await ethers.getSigners();

  await testToken.transfer(seller.address, TOKEN_AMOUNT);
  await testToken.connect(seller).approve(auction.target, TOKEN_AMOUNT);
  await auction.connect(seller).createAuction(
    testToken.target,
    TOKEN_AMOUNT,
    START_PRICE,
    END_PRICE,
    DURATION
  );

  const timeIntervals = [0, 90, 180, 270, 360]; // 0, 15, 30, 45, 60 minutes
  const auctionId = Number(await auction.getAuctionCount()) - 1;

  console.log("\nPrice changes over time:");
  console.log("------------------------");

  for (const interval of timeIntervals) {
    await time.increase(interval - (await time.latest() % interval));
    const currentPrice = await auction.getCurrentPrice(auctionId);
    console.log(
      `Time: ${interval / 60} minutes, Price: ${ethers.formatEther(currentPrice)} ETH`
    );
  }
}

async function main() {
  try {
    await simulateAuction();
    
    await checkPriceIntervals();
    
    console.log("\n=== All simulations completed successfully ===");
  } catch (error) {
    console.error("Error during simulation:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });