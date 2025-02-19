import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// Contract addresses - replace these with your deployed addresses
const TEST_TOKEN_ADDRESS = "0xD2A4222BF8A38E52aA849D9D5e6559D503B1CCE9";
const AUCTION_ADDRESS = "0x6502E4081EB53b41703F8C63c1Fe4CD65feF6E25";

// Auction parameters
const TOKEN_AMOUNT = ethers.parseEther("100");  // 100 tokens
const START_PRICE = ethers.parseEther("1");     // 1 ETH
const END_PRICE = ethers.parseEther("0.1");     // 0.1 ETH
const DURATION = 3600;                          // 1 hour

async function simulateAuction() {
  console.log("\n=== Starting Auction Simulation ===");
  
  // Get contract instances
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);
  const auction = await ethers.getContractAt("ReverseDutchAuctionSwap", AUCTION_ADDRESS);

  // Get signers
  const [owner, seller, buyer] = await ethers.getSigners();
  console.log("Seller address:", seller.address;
  console.log("Buyer address:", buyer.address);

  // Transfer tokens to seller
  console.log("\nTransferring tokens to seller...");
  await testToken.transfer(seller.address, TOKEN_AMOUNT);
  console.log("Seller token balance:", await testToken.balanceOf(seller.address));

  // Seller approves auction contract
  console.log("\nApproving auction contract...");
  await testToken.connect(seller).approve(auction.target, TOKEN_AMOUNT);
  console.log("Approval completed");

  // Create auction
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

  // Simulate time passing (15 minutes)
  console.log("\nAdvancing time by 15 minutes...");
  await time.increase(900);

  // Get price after 15 minutes
  const midPrice = await auction.getCurrentPrice(auctionId);
  console.log("Price after 15 minutes:", ethers.formatEther(midPrice), "ETH");

  // Execute swap
  console.log("\nExecuting swap...");
  const swapTx = await auction.connect(buyer).executeSwap(auctionId, {
    value: midPrice
  });
  await swapTx.wait();

  // Check final balances
  const buyerTokenBalance = await testToken.balanceOf(buyer.address);
  console.log("\nFinal buyer token balance:", ethers.formatEther(buyerTokenBalance));
}

async function checkPriceIntervals() {
  console.log("\n=== Checking Price Intervals ===");
  
  // Get contract instances
  const testToken = await ethers.getContractAt("TestToken", TEST_TOKEN_ADDRESS);
  const auction = await ethers.getContractAt("ReverseDutchAuctionSwap", AUCTION_ADDRESS);

  // Get signers
  const [owner, seller] = await ethers.getSigners();

  // Setup new auction
  await testToken.transfer(seller.address, TOKEN_AMOUNT);
  await testToken.connect(seller).approve(auction.target, TOKEN_AMOUNT);
  await auction.connect(seller).createAuction(
    testToken.target,
    TOKEN_AMOUNT,
    START_PRICE,
    END_PRICE,
    DURATION
  );

  // Check prices at different intervals
  const timeIntervals = [0, 900, 1800, 2700, 3600]; // 0, 15, 30, 45, 60 minutes
  const auctionId = await auction.getAuctionCount() - 1;

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
    // Run auction simulation
    await simulateAuction();
    
    // Run price interval checks
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