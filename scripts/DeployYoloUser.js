// npx hardhat run scripts/DeployYoloUser.js --network sepolia

// update these variables
var dataBridgeAddress = "0x0000000000000000000000000000000000000000"
var queryId = "0x0000000000000000000000000000000000000000000000000000000000000000"
var PK = process.env.TESTNET_PK
var NODE_URL = process.env.NODE_URL_SEPOLIA_TESTNET

async function deployYoloUser(_pk, _nodeURL) {
    //Connect to the network
    let privateKey = _pk;
    var provider = new ethers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider);
    
    ////////  Deploy YoloUser contract  ////////////////////////
    console.log("deploying YoloUser")
    const YoloUser = await ethers.getContractFactory("contracts/YoloUser.sol:YoloUser", wallet);
    const yoloUser = await YoloUser.deploy(dataBridgeAddress, queryId);
    await yoloUser.waitForDeployment();
    console.log("YoloUser deployed to:", await yoloUser.getAddress());
  };

  deployYoloUser(PK, NODE_URL)
    .then(() => process.exit(0))
    .catch(error => {
	  console.error(error);
	  process.exit(1);
  });
