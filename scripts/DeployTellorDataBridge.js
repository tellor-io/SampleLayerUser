const TellorDataBridgeArtifact = require("usingtellorlayer/artifacts/contracts/testing/bridge/TellorDataBridge.sol/TellorDataBridge.json");

// npx hardhat run scripts/DeployTellorDataBridge.js --network sepolia

// update these variables
var guardianaddress = "0x0000000000000000000000000000000000000000"
var PK = process.env.TESTNET_PK
var NODE_URL = process.env.NODE_URL_SEPOLIA_TESTNET

async function deployTellorDataBridge(_pk, _nodeURL) {
    //Connect to the network
    let privateKey = _pk;
    var provider = new ethers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider);
    
    ////////  Deploy TellorDataBridge contract  ////////////////////////
    console.log("deploy TellorDataBridge")
    const TellorDataBridge = await ethers.getContractFactory(TellorDataBridgeArtifact.abi, TellorDataBridgeArtifact.bytecode, wallet);
    const tellorDataBridge = await TellorDataBridge.deploy(guardianaddress);
    await tellorDataBridge.waitForDeployment();
    console.log("TellorDataBridge deployed to:", await tellorDataBridge.getAddress());
  };

  deployTellorDataBridge(PK, NODE_URL)
    .then(() => process.exit(0))
    .catch(error => {
	  console.error(error);
	  process.exit(1);
  });
