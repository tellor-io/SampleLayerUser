// npx hardhat run scripts/DeploySampleMVPUser.js --network sepolia

// update these variables
var dataBridgeAddress = "0x0000000000000000000000000000000000000000"
var queryId = "0x0000000000000000000000000000000000000000000000000000000000000000"
var PK = process.env.TESTNET_PK
var NODE_URL = process.env.NODE_URL_SEPOLIA_TESTNET

async function deploySimpleLayerUser(_pk, _nodeURL) {
    //Connect to the network
    let privateKey = _pk;
    var provider = new ethers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider);
    
    ////////  Deploy SimpleLayerUser contract  ////////////////////////
    console.log("deploying SimpleLayerUser")
    const MVPUser = await ethers.getContractFactory("contracts/SampleMVPUser.sol:SampleMVPUser", wallet);
    const mvpUser = await MVPUser.deploy(dataBridgeAddress, queryId);
    await mvpUser.waitForDeployment();
    console.log("SimpleLayerUser deployed to:", await mvpUser.getAddress());
  };

  deploySimpleLayerUser(PK, NODE_URL)
    .then(() => process.exit(0))
    .catch(error => {
	  console.error(error);
	  process.exit(1);
  });
