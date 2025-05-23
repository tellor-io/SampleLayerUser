var assert = require('assert');
const h = require("usingtellorlayer/src/helpers/evmHelpers.js")
const TellorDataBridgeArtifact = require("usingtellorlayer/artifacts/contracts/testing/bridge/TellorDataBridge.sol/TellorDataBridge.json");
const abiCoder = new ethers.AbiCoder();

// encode query data and query id for eth/usd price feed
const ETH_USD_QUERY_DATA_ARGS = abiCoder.encode(["string","string"], ["eth","usd"])
const ETH_USD_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", ETH_USD_QUERY_DATA_ARGS])
const ETH_USD_QUERY_ID = h.hash(ETH_USD_QUERY_DATA)

// define tellor validator unbonding period
const UNBONDING_PERIOD = 86400 * 7 * 3; // 3 weeks

describe("Yolo User - Function Tests", function () {
  // init the assets which will be used in the tests
  let accounts, user, dataBridge, guardian
  let threshold, val1, initialPowers, initialValAddrs;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    guardian = accounts[1]
    val1 = ethers.Wallet.createRandom()
    initialValAddrs = [val1.address]
    initialPowers = [100]
    threshold = 66
    blocky = await h.getBlock()
    valTimestamp = (blocky.timestamp - 2) * 1000
    newValHash = await h.calculateValHash(initialValAddrs, initialPowers)
    valCheckpoint = h.calculateValCheckpoint(newValHash, threshold, valTimestamp)
    let TellorDataBridge = await ethers.getContractFactory(TellorDataBridgeArtifact.abi, TellorDataBridgeArtifact.bytecode);
    dataBridge = await TellorDataBridge.deploy(guardian.address)
    await dataBridge.init(threshold, valTimestamp, UNBONDING_PERIOD, valCheckpoint)
    user = await ethers.deployContract("YoloUser", [dataBridge.target,ETH_USD_QUERY_ID]);
  })
  it("constructor", async function () {
    assert(await user.dataBridge.call() == dataBridge.target, "dataBridge should be set right")
    assert(await user.queryId.call() == ETH_USD_QUERY_ID, "queryID should be set correct")
  });
  it("updateOracleData, getCurrentData, getValueCount", async function () {
    // "value" is the reported oracle data, in this case the ETH/USD price
    let _value = abiCoder.encode(["uint256"], [3000])
    _initialValidators = [val1]
    const { attestData, currentValidatorSet, sigs } = await h.prepareOracleData(ETH_USD_QUERY_ID, _value, _initialValidators, initialPowers, valCheckpoint)
    let _b = await h.getBlock() // get block before update
    await user.updateOracleData(attestData, currentValidatorSet, sigs);
    let _dataRetrieved =  await user.getCurrentData();
    assert(_dataRetrieved.value == _value, "value should be correct");
    // report timestamp is defined in prepareOracleData as: (block.timestamp - 2) * 1000
    assert(_dataRetrieved.timestamp == (_b.timestamp - 2) * 1000, "timestamp should be correct")
    assert(await user.getValueCount.call() == 1, "value count should be correct")
  });
});
