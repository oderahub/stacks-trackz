const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  principalCV,
} = require("@stacks/transactions");

const MNEMONIC = process.env.MNEMONIC;

if (!MNEMONIC) {
  console.error("Error: MNEMONIC environment variable is required");
  console.error("Usage: MNEMONIC='your 24 words here' node scripts/set-minter.js");
  process.exit(1);
}

async function setAuthorizedMinter() {
  // Derive private key from mnemonic
  const { generateWallet } = require("@stacks/wallet-sdk");
  const wallet = await generateWallet({ secretKey: MNEMONIC, password: "" });
  const privateKey = wallet.accounts[0].stxPrivateKey;

  const txOptions = {
    contractAddress: "SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG",
    contractName: "presence-badges",
    functionName: "set-authorized-minter",
    functionArgs: [
      principalCV("SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG.presence-tracker"),
    ],
    senderKey: privateKey,
    network: "mainnet",
    anchorMode: AnchorMode.Any,
    fee: 2000n,
  };

  console.log("Building transaction...");
  const transaction = await makeContractCall(txOptions);

  console.log("Broadcasting transaction...");
  const result = await broadcastTransaction(transaction, "mainnet");

  if (result.error) {
    console.error("Error:", result.error, result.reason);
  } else {
    console.log("Transaction broadcasted successfully!");
    console.log("TX ID:", result.txid);
    console.log(`View: https://explorer.stacks.co/txid/${result.txid}?chain=mainnet`);
  }
}

setAuthorizedMinter().catch(console.error);
