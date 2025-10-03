const { ethers } = require("hardhat");
var assert = require('assert');
const abiCoder = new ethers.AbiCoder();
const DataBankPlaygroundArtifact = require("usingtellorlayer/artifacts/contracts/testing/DataBankPlayground.sol/DataBankPlayground.json");

// encode query data and query id for eth/usd price feed
const ETH_USD_QUERY_DATA_ARGS = abiCoder.encode(["string","string"], ["eth","usd"])
const ETH_USD_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", ETH_USD_QUERY_DATA_ARGS])
const ETH_USD_QUERY_ID = ethers.keccak256(ETH_USD_QUERY_DATA)

describe("DataBankPlayground - Function Tests", function () {
  // init the assets which will be used in the tests
  let accounts, databank, user;

  beforeEach(async function () {
    // init accounts
    accounts = await ethers.getSigners();
    // deploy databank from usingtellorlayer
    let DataBankPlayground = await ethers.getContractFactory(DataBankPlaygroundArtifact.abi, DataBankPlaygroundArtifact.bytecode);
    databank = await DataBankPlayground.deploy();
    // deploy user
    user = await ethers.deployContract("PlaygroundUser", [databank.target, ETH_USD_QUERY_ID]);
  })

  it("retrieveData", async function () {
    // price as $3000
    let price = "3000";
    // SpotPrice reported with 18 decimals
    priceWithDecimals = ethers.parseUnits(price, 18);
    // encode the price as bytes
    let _value = abiCoder.encode(["uint256"], [priceWithDecimals])
    // update the oracle data using the playground function
    await databank.updateOracleDataPlayground(ETH_USD_QUERY_ID, _value);
    let _b = await ethers.provider.getBlock() // get block before update
    // retrieve and save the data
    await user.retrieveData();
    // assert the value is correct
    let _savedPrice = await user.savedPrice();
    assert.equal(_savedPrice, priceWithDecimals, "value should be correct");
    // assert the timestamp is correct (set to block.timestamp - 1 in contract)
    let _savedTimestamp = await user.savedTimestamp();
    assert.equal(_savedTimestamp, _b.timestamp - 1, "timestamp should be correct")
  });
});
