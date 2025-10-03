var assert = require('assert');
const h = require("usingtellorlayer/src/helpers/evmHelpers.js")
const TellorDataBridgeArtifact = require("usingtellorlayer/artifacts/contracts/bridge/TellorDataBridge.sol/TellorDataBridge.json");
const abiCoder = new ethers.AbiCoder();

// encode query data and query id for eth/usd price feed
const ETH_USD_QUERY_DATA_ARGS = abiCoder.encode(["string","string"], ["eth","usd"])
const ETH_USD_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", ETH_USD_QUERY_DATA_ARGS])
const ETH_USD_QUERY_ID = h.hash(ETH_USD_QUERY_DATA)

// define tellor chain parameters
const TELLOR_CHAIN_ID = "tellor-1"
const UNBONDING_PERIOD = 86400 * 7 * 3; // 3 weeks

describe("Yolo User - Function Tests", function () {
  // init the assets which will be used in the tests
  let accounts, user, dataBridge, guardian, validatorSet;

  beforeEach(async function () {
    // init accounts
    accounts = await ethers.getSigners();
    guardian = accounts[10]
    // init tellor validator set
    validatorSet = await h.createTellorValset({tellorChainId: TELLOR_CHAIN_ID})
    // deploy dataBridge
    let TellorDataBridge = await ethers.getContractFactory(TellorDataBridgeArtifact.abi, TellorDataBridgeArtifact.bytecode);
    dataBridge = await TellorDataBridge.deploy(guardian.address, validatorSet.domainSeparator)
    await dataBridge.init(validatorSet.powerThreshold, validatorSet.timestamp, UNBONDING_PERIOD, validatorSet.checkpoint)
    // deploy user
    user = await ethers.deployContract("YoloUser", [dataBridge.target, ETH_USD_QUERY_ID]);
  })

  it("constructor", async function () {
    assert.equal(await user.dataBridge(), await dataBridge.getAddress(), "dataBridge should be set right")
    assert.equal(await user.queryId(), ETH_USD_QUERY_ID, "queryID should be set correct")
  });

  it("updateOracleData, getCurrentData, getValueCount", async function () {
    // "value" is the reported oracle data, in this case the ETH/USD price
    let _value = abiCoder.encode(["uint256"], [3000])
    const { attestData, currentValidatorSet, sigs } = await h.prepareOracleData(ETH_USD_QUERY_ID, _value, validatorSet)
    let _b = await h.getBlock() // get block before update
    await user.updateOracleData(attestData, currentValidatorSet, sigs);
    let _dataRetrieved =  await user.getCurrentData();
    assert.equal(_dataRetrieved.value, _value, "value should be correct");
    // report timestamp is defined in prepareOracleData as: (block.timestamp - 2) * 1000
    assert.equal(_dataRetrieved.timestamp, (_b.timestamp - 2) * 1000, "timestamp should be correct")
    assert.equal(await user.getValueCount(), 1, "value count should be correct")
  });
});
