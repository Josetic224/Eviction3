import { run } from "hardhat";

const TEST_TOKEN_ADDRESS = "0xD2A4222BF8A38E52aA849D9D5e6559D503B1CCE9";
const AUCTION_ADDRESS = "0x6502E4081EB53b41703F8C63c1Fe4CD65feF6E25";

async function main() {
  console.log("Starting contract verification...");

  try {
    // Verify TestToken
    console.log("\nVerifying TestToken...");
    await run("verify:verify", {
      address: TEST_TOKEN_ADDRESS,
      constructorArguments: [
        "Test Token",    // name
        "TEST",         // symbol
        "1000000000000000000000000" // initial supply (1 million tokens)
      ],
    });
    console.log("TestToken verified successfully");

    // Verify ReverseDutchAuctionSwap
    console.log("\nVerifying ReverseDutchAuctionSwap...");
    await run("verify:verify", {
      address: AUCTION_ADDRESS,
      constructorArguments: [], // No constructor arguments for the auction contract
    });
    console.log("ReverseDutchAuctionSwap verified successfully");

  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });