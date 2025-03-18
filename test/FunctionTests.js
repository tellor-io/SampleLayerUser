var assert = require('assert');
const abiCoder = new ethers.AbiCoder();
const { expect } = require("chai");
const h = require("./helpers/evmHelpers.js");
const { report } = require('process');

const PRICEFEED_DATA_ARGS = abiCoder.encode(["string","string"], ["trb","usd"])
const PRICEFEED_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", PRICEFEED_DATA_ARGS])
const PRICEFEED_QUERY_ID = h.hash(PRICEFEED_QUERY_DATA)

const CPI_DATA_ARGS = abiCoder.encode(["string","string"], ["trb","usd"]) //note this is just a sample, not actual id
const CPI_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", CPI_DATA_ARGS])
const CPI_QUERY_ID = h.hash(CPI_QUERY_DATA)

const sampleBytes = abiCoder.encode(["string"],["test1234"])
const sampleAddress = "0x5D42EBdBBa61412295D7b0302d6F50aC449Ddb4F"
const EVMCALL_DATA_ARGS = abiCoder.encode(["uint256","address","bytes"], [1,sampleAddress,sampleBytes])
const EVMCALL_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["EVMCall", EVMCALL_DATA_ARGS])
const EVMCALL_QUERY_ID = h.hash(EVMCALL_QUERY_DATA)

const PREDICTIONMARKET_DATA_ARGS = abiCoder.encode(["string","string"], ["trb","usd"])//note this is just a sample, not actual id
const PREDICTIONMARKET_QUERY_DATA = abiCoder.encode(["string", "bytes"], ["SpotPrice", PREDICTIONMARKET_DATA_ARGS])
const PREDICTIONMARKET_QUERY_ID = h.hash(PREDICTIONMARKET_QUERY_DATA)
const UNBONDING_PERIOD = 86400 * 7 * 3; // 3 weeks

describe("Sample Layer User - function tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  let accounts, cpiUser, evmCallUser, fallbackUser, predictionMarketUser, priceFeedUser, testPriceFeedUser, blobstream, guardian, governance, centralizedOracle
  let threshold, val1, val2, initialPowers, initialValAddrs;

  async function  submitData(queryId, value, aggregatePower, reportTimestamp){
    //e.g. value = abiCoder.encode(["uint256"], [2000])
    // e.g. queryId = h.hash("myquery")
    blocky = await h.getBlock()
    attestTimestamp = blocky.timestamp * 1000
    timestamp = (reportTimestamp - 2) * 1000
    previousTimestamp = 0
    nextTimestamp = 0
    newValHash = await h.calculateValHash(initialValAddrs, initialPowers)
    valCheckpoint = await h.calculateValCheckpoint(newValHash, threshold, valTimestamp)
    dataDigest = await h.getDataDigest(
        queryId,
        value,
        timestamp,
        aggregatePower,
        previousTimestamp,
        nextTimestamp,
        valCheckpoint,
        attestTimestamp,
        timestamp
    )
    currentValSetArray = await h.getValSetStructArray(initialValAddrs, initialPowers)
    sig1 = await h.layerSign(dataDigest, val1.privateKey)
    sig2 = await h.layerSign(dataDigest, val2.privateKey)
    sig3 = await h.layerSign(dataDigest, val3.privateKey)
    sigStructArray = await h.getSigStructArray([ethers.Signature.from(sig1), ethers.Signature.from(sig2),ethers.Signature.from(sig3)])
    oracleDataStruct = await h.getOracleDataStruct(
        queryId,
        value,
        timestamp,
        aggregatePower,
        previousTimestamp,
        nextTimestamp,
        attestTimestamp,
        timestamp
    )
        await blobstream.verifyOracleData(
          oracleDataStruct,
          currentValSetArray,
          sigStructArray
      )
    return [oracleDataStruct,currentValSetArray,sigStructArray]
  }
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    guardian = accounts[1]
    val1 = ethers.Wallet.createRandom()
    val2 = ethers.Wallet.createRandom()
    val3 = ethers.Wallet.createRandom()
    val4 = ethers.Wallet.createRandom()
    val5 = ethers.Wallet.createRandom()
    val6 = ethers.Wallet.createRandom()
    val7 = ethers.Wallet.createRandom()
    val8 = ethers.Wallet.createRandom()
    val9 = ethers.Wallet.createRandom()
    val10 = ethers.Wallet.createRandom()
    initialValAddrs = [val1.address, val2.address, val3.address]
    initialPowers = [3,3,2]
    threshold = 6
    blocky = await h.getBlock()
    valTimestamp = (blocky.timestamp - 2) * 1000
    newValHash = await h.calculateValHash(initialValAddrs, initialPowers)
    valCheckpoint = h.calculateValCheckpoint(newValHash, threshold, valTimestamp)
    blobstream= await ethers.deployContract("BlobstreamO", [guardian.address]);
    await blobstream.init(threshold, valTimestamp, UNBONDING_PERIOD, valCheckpoint)
    cpiUser = await ethers.deployContract("SampleCPIUser", [blobstream.target,CPI_QUERY_ID,guardian.address]);
    governance = accounts[2]
    evmCallUser = await ethers.deployContract("SampleEVMCallUser",[blobstream.target,EVMCALL_QUERY_ID,guardian.address, governance.address]);
    centralizedOracle = accounts[3]
    fallbackUser = await ethers.deployContract("SampleFallbackOracleUser",[blobstream.target,PRICEFEED_QUERY_ID,guardian.address, governance.address, centralizedOracle.address]);
    predictionMarketUser = await ethers.deployContract("SamplePredictionMarketUser",[blobstream.target,PREDICTIONMARKET_QUERY_ID,guardian.address]);
    priceFeedUser = await ethers.deployContract("SamplePriceFeedUser",[blobstream.target,PRICEFEED_QUERY_ID,guardian.address]);
    testPriceFeedUser = await ethers.deployContract("TestPriceFeedUser",[blobstream.target,PRICEFEED_QUERY_ID,guardian.address]);
  })
  describe("SampleCPIUser - Function Tests", function () {
    it("SampleCPIUser - Constructor", async function () {
      assert(await cpiUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await cpiUser.queryId.call() == CPI_QUERY_ID, "queryID should be set correct")
      assert(await cpiUser.guardian.call() == guardian.address);
    });
    it("SampleCPIUser - pauseContract", async function () {
      await h.expectThrow(cpiUser.pauseContract())
      //only gaurdian
      await cpiUser.connect(guardian).pauseContract()
      assert(await cpiUser.paused.call(), "should be pause")
    });
    it("SampleCPIUser - updateOracleData, getCurrentData", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(CPI_QUERY_ID,_value, _power, _b0.timestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await cpiUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      let vars =  await cpiUser.getCurrentData();
      assert(vars[0] = _value);
      assert(vars[1] = _b0.timestamp, "timestamp should be correct")
      assert(vars[2] = _power)
      assert(vars[5] == _b1.timestamp)
    });
    it("SampleCPIUser - getAllData, getValueCount", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [1000])
      let res = await submitData(CPI_QUERY_ID,_value, _power,_b0.timestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await cpiUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      assert(await cpiUser.getValueCount.call() == 1)
      await h.advanceTime(86400)
      let _b2= await h.getBlock()
      let _power2 = 6;
      let _value2 = abiCoder.encode(["uint256"], [2000])
      res = await submitData(CPI_QUERY_ID,_value2, _power2,_b2.timestamp);
      let _attestData2= res[0]
      let _currentValidatorSet2 = res[1]
      let _sigs2 = res[2]
      await cpiUser.updateOracleData(_attestData2, _currentValidatorSet2, _sigs2);
      let _b3= await h.getBlock()
      let vars = await cpiUser.getAllData()
      assert(vars[0].value == _value);
      assert(vars[0].timestamp== (_b0.timestamp - 2) * 1000)
      assert(vars[0].aggregatePower == _power)
      assert(vars[0].relayTimestamp == _b1.timestamp)
      assert(vars[1].value == abiCoder.encode(["uint256"], [1100]));//capped at 10% move
      assert(vars[1].timestamp == (_b2.timestamp - 2) * 1000)
      assert(vars[1].aggregatePower == _power2)
      assert(vars[1].relayTimestamp == _b3.timestamp)
      assert(await cpiUser.getValueCount.call() == 2)
    });
  });
  describe("SampleEVMCallUser - Function Tests", function () {
    it("SampleEVMCallUser -Constructor", async function () {
      assert(await evmCallUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await evmCallUser.queryId.call() == EVMCALL_QUERY_ID, "queryID should be set correct")
      assert(await evmCallUser.guardian.call() == guardian.address);
      assert(await evmCallUser.governance.call() == governance.address, "governance should set")
    });
    it("SampleEVMCallUser -changeGuardian", async function () {
      await h.expectThrow(evmCallUser.changeGuardian(accounts[8].address))
        //must be governance
      await evmCallUser.connect(governance).changeGuardian(accounts[9].address)
      //must wait 7 days
      assert(await evmCallUser.guardian.call() == guardian.address);
      assert(await evmCallUser.proposedGuardian.call() == accounts[9].address);
      await h.expectThrow(evmCallUser.changeGuardian(accounts[8].address))
      await h.advanceTime(86400*7)
      await evmCallUser.changeGuardian(accounts[8].address)
      assert(await evmCallUser.guardian.call() == accounts[9].address);
    });
    it("SampleEVMCallUser -changeOracle", async function () {
      await h.expectThrow(evmCallUser.changeOracle(accounts[8].address))
      //must be governance
      await evmCallUser.connect(governance).changeOracle(accounts[9].address)
      //must wait 7 days
      assert(await evmCallUser.blobstreamO.call() == blobstream.target);
      assert(await evmCallUser.proposedOracle.call() == accounts[9].address);
      await h.expectThrow(evmCallUser.changeOracle(accounts[8].address))
      await h.advanceTime(86400*7)
      await evmCallUser.changeOracle(accounts[8].address)
      assert(await evmCallUser.blobstreamO.call() == accounts[9].address);
    });
    it("SampleEVMCallUser - togglePause", async function () {
      await h.expectThrow(evmCallUser.togglePause())//must be gauardian
      //guardian pauses, cannot update oracle\
      assert(await evmCallUser.paused.call() == false);
      await evmCallUser.connect(guardian).togglePause()
      assert(await evmCallUser.paused.call() == true, "should be paused");
      let _b0= await h.getBlock()
      let _power = 6;
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(EVMCALL_QUERY_ID,_value, _power, _reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await h.expectThrow(evmCallUser.updateOracleData(_attestData, _currentValidatorSet, _sigs));
      //unpauses, can updateOracle
      await evmCallUser.connect(guardian).togglePause()
      assert(await evmCallUser.paused.call() == false);
      await evmCallUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
    });
    it("SampleEVMCallUser - updateOracleData, getCurrentData", async function () {
        let _b0= await h.getBlock()
        let _power = 6;
        let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
        let _value = abiCoder.encode(["uint256"], [3000])
        let res = await submitData(EVMCALL_QUERY_ID,_value, _power, _reportTimestamp);
        let _attestData = res[0]
        let _currentValidatorSet = res[1]
        let _sigs = res[2]
        await evmCallUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
        let _b1= await h.getBlock()
        let vars =  await evmCallUser.getCurrentData();
        assert(vars[0] = _value);
        assert(vars[1] = _b0.timestamp, "timestamp should be correct")
        assert(vars[2] = _power)
        assert(vars[5] == _b1.timestamp)
    });
    it("SampleEVMCallUser - getAllData, getValueCount", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [1000])
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let res = await submitData(EVMCALL_QUERY_ID,_value, _power,_reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await evmCallUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      assert(await evmCallUser.getValueCount.call() == 1)
      await h.advanceTime(86400)
      let _b2= await h.getBlock()
      let _power2 = 6;
      let _value2 = abiCoder.encode(["uint256"], [2000])
      res = await submitData(EVMCALL_QUERY_ID,_value2, _power2,_b2.timestamp - 60*61);
      let _attestData2= res[0]
      let _currentValidatorSet2 = res[1]
      let _sigs2 = res[2]
      await evmCallUser.updateOracleData(_attestData2, _currentValidatorSet2, _sigs2);
      let _b3= await h.getBlock()
      let vars = await evmCallUser.getAllData()
      assert(vars[0].value == _value);
      assert(vars[0].timestamp== (_b0.timestamp - 60*61 - 2) * 1000)
      assert(vars[0].aggregatePower == _power)
      assert(vars[0].relayTimestamp == _b1.timestamp)
      assert(vars[1].value == abiCoder.encode(["uint256"], [2000]));
      assert(vars[1].timestamp == (_b2.timestamp - 60*61 - 2) * 1000)
      assert(vars[1].aggregatePower == _power2)
      assert(vars[1].relayTimestamp == _b3.timestamp)
      assert(await evmCallUser.getValueCount.call() == 2)
    });
  });
  describe("SampleFallbackOracleUser - Function Tests", function () {
    it("SampleFallbackOracleUser - Constructor", async function () {
      assert(await fallbackUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await fallbackUser.queryId.call() == PRICEFEED_QUERY_ID, "queryID should be set correct")
      assert(await fallbackUser.guardian.call() == guardian.address);
      assert(await fallbackUser.governance.call() == governance.address, "governance should set")
      assert(await fallbackUser.centralizedOracle.call() == centralizedOracle.address, "centralized oracle should be set")
    });
    it("SampleFallbackOracleUser - changeFallback", async function () {
      await h.expectThrow(fallbackUser.connect(guardian).changeFallback(accounts[9].address))
      let _b0= await h.getBlock()
      let _power = 6;
      let _reportTimestamp = _b0.timestamp - 60*15//at least 15 minutes
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(PRICEFEED_QUERY_ID,_value, _power, _reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await fallbackUser.connect(centralizedOracle).updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let vars =  await fallbackUser.getCurrentData();
      assert(vars[0] = _value);
      assert(vars[1] = _b0.timestamp - 2, "timestamp should be correct")
      let _b1= await h.getBlock()
      await h.expectThrow(fallbackUser.connect(guardian).changeFallback(accounts[9].address))
      await h.advanceTime(86400 *7)
      await h.expectThrow(fallbackUser.changeFallback(accounts[9].address))
      await fallbackUser.connect(guardian).changeFallback(accounts[9].address)
      assert(await fallbackUser.blobstreamO.call() == accounts[9].address)
    });
    it("SampleFallbackOracleUser - changeGuardian", async function () {
      await h.expectThrow(fallbackUser.changeGuardian(accounts[8].address))
      //must be governance
      await fallbackUser.connect(governance).changeGuardian(accounts[9].address)
      //must wait 7 days
      assert(await fallbackUser.guardian.call() == guardian.address);
      assert(await fallbackUser.proposedGuardian.call() == accounts[9].address);
      await h.expectThrow(fallbackUser.changeGuardian(accounts[8].address))
      await h.advanceTime(86400*7)
      await fallbackUser.changeGuardian(accounts[8].address)
      assert(await fallbackUser.guardian.call() == accounts[9].address);
    });
    it("SampleFallbackOracleUser - changeOracle", async function () {
      await h.expectThrow(fallbackUser.changeOracle(accounts[8].address))
        //must be governance
      await fallbackUser.connect(governance).changeOracle(accounts[9].address)
        //must wait 7 days
      assert(await fallbackUser.centralizedOracle.call() == centralizedOracle.address);
      assert(await fallbackUser.proposedOracle.call() == accounts[9].address);
      await h.expectThrow(fallbackUser.changeOracle(accounts[8].address))
      await h.advanceTime(86400*7)
      await fallbackUser.changeOracle(accounts[8].address)
      assert(await fallbackUser.centralizedOracle.call() == accounts[9].address);
    });
    it("SampleFallbackOracleUser - pauseContract", async function () {
      await h.expectThrow(fallbackUser.pauseContract())
      //only gaurdian
      await fallbackUser.connect(guardian).pauseContract()
      let _b1= await h.getBlock()
      assert(await fallbackUser.pauseTimestamp.call() == _b1.timestamp, "should be pause");
      //cannot run updateOracle or call pause again
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(PRICEFEED_QUERY_ID,_value, _power,_b0.timestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await h.expectThrow(fallbackUser.updateOracleData(_attestData, _currentValidatorSet, _sigs));
      await h.expectThrow(fallbackUser.connect(guardian).pauseContract())
      //unpauses, can updateOracle
      await h.advanceTime(86400*2)
      await fallbackUser.connect(centralizedOracle).updateOracleData(_attestData, _currentValidatorSet, _sigs)
      await fallbackUser.connect(guardian).pauseContract()
      _b1= await h.getBlock()
      assert(await fallbackUser.pauseTimestamp.call() == _b1.timestamp, "should be pause");
    });
    it("SampleFallbackOracleUser - updateOracleData, getCurrentData,getAllData, getValueCount", async function () {
        let _b0= await h.getBlock()
        let _power = 6;
        let _reportTimestamp = _b0.timestamp
        let _value = abiCoder.encode(["uint256"], [3000])
        let res = await submitData(PRICEFEED_QUERY_ID,_value, _power, _reportTimestamp);
        let _attestData = res[0]
        let _currentValidatorSet = res[1]
        let _sigs = res[2]
        await h.expectThrow(fallbackUser.updateOracleData(_attestData, _currentValidatorSet, _sigs))//not oracle
        await fallbackUser.connect(centralizedOracle).updateOracleData(_attestData, _currentValidatorSet, _sigs);
        let _b1= await h.getBlock()
        let vars =  await fallbackUser.getCurrentData();
        assert(vars[0] = _value);
        assert(vars[1] = _b0.timestamp - 2, "timestamp should be correct")
        assert(vars[2] = _power)
        assert(vars[5] == _b1.timestamp)
        //now fallback
        await h.advanceTime(60*60)//1 hr advance
        _b2= await h.getBlock()
        _power2 = 6;
        _reportTimestamp2 = _b2.timestamp - 60*15//at least 15 minutes
        _value2 = abiCoder.encode(["uint256"], [9000])
        res = await submitData(PRICEFEED_QUERY_ID,_value2, _power, _reportTimestamp2);
        _attestData = res[0]
        _currentValidatorSet = res[1]
        _sigs = res[2]
        await fallbackUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
        assert(await fallbackUser.getValueCount.call() == 2)
        let _b3= await h.getBlock()
        vars = await fallbackUser.getAllData()
        assert(vars[0].value == _value);
        assert(vars[0].timestamp== (_b0.timestamp - 2) * 1000)
        assert(vars[0].aggregatePower == _power)
        assert(vars[0].relayTimestamp == _b1.timestamp)
        assert(vars[1].value == abiCoder.encode(["uint256"], [9000]));
        assert(vars[1].timestamp == (_reportTimestamp2 - 2) * 1000)
        assert(vars[1].aggregatePower == _power2)
        assert(vars[1].relayTimestamp == _b3.timestamp)
    });
  });
  describe("SamplePredictionMarketUser - Function Tests", function () {
    it("SamplePredictionMarketUser - Constructor", async function () {
      assert(await predictionMarketUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await predictionMarketUser.queryId.call() == PREDICTIONMARKET_QUERY_ID, "queryID should be set correct")
      assert(await predictionMarketUser.guardian.call() == guardian.address);
    });
    it("SamplePredictionMarketUser - pauseContract", async function () {
      await h.expectThrow(predictionMarketUser.pauseContract())
      //only gaurdian
      await predictionMarketUser.connect(guardian).pauseContract()
      assert(await predictionMarketUser.paused.call(), "should be pause")
    });
    it("SamplePredictionMarketUser - updateOracleData, getCurrentData", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(PREDICTIONMARKET_QUERY_ID,_value, _power, _reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await predictionMarketUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      let vars =  await predictionMarketUser.getCurrentData();
      assert(vars[0] = _value);
      assert(vars[1] = _b0.timestamp, "timestamp should be correct")
      assert(vars[2] = _power)
      assert(vars[5] == _b1.timestamp)
    });
    it("SamplePredictionMarketUser - getAllData getValueCount", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [1000])
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let res = await submitData(PREDICTIONMARKET_QUERY_ID,_value, _power,_reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await predictionMarketUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      assert(await predictionMarketUser.getValueCount.call() == 1)
      await h.advanceTime(86400)
      let _b2= await h.getBlock()
      let _power2 = 6;
      let _value2 = abiCoder.encode(["uint256"], [2000])
      res = await submitData(PREDICTIONMARKET_QUERY_ID,_value2, _power2,_b2.timestamp - 60*61);
      let _attestData2= res[0]
      let _currentValidatorSet2 = res[1]
      let _sigs2 = res[2]
      await predictionMarketUser.updateOracleData(_attestData2, _currentValidatorSet2, _sigs2);
      let _b3= await h.getBlock()
      let vars = await predictionMarketUser.getAllData()
      assert(vars[0].value == _value);
      assert(vars[0].timestamp== (_b0.timestamp - 60*61 - 2) * 1000)
      assert(vars[0].aggregatePower == _power)
      assert(vars[0].relayTimestamp == _b1.timestamp)
      assert(vars[1].value == abiCoder.encode(["uint256"], [2000]));
      assert(vars[1].timestamp == (_b2.timestamp - 60*61 - 2) * 1000)
      assert(vars[1].aggregatePower == _power2)
      assert(vars[1].relayTimestamp == _b3.timestamp)
      assert(await predictionMarketUser.getValueCount.call() == 2)
    });
  });
  describe("SamplePriceFeedUser - Function Tests", function () {
    it("SamplePriceFeedUser - Constructor", async function () {
      assert(await priceFeedUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await priceFeedUser.queryId.call() == PRICEFEED_QUERY_ID, "queryID should be set correct")
      assert(await priceFeedUser.guardian.call() == guardian.address);
    });
    it("SamplePriceFeedUser - pauseContract", async function () {
      await h.expectThrow(priceFeedUser.pauseContract())
      await priceFeedUser.connect(guardian).pauseContract()
      assert(await priceFeedUser.paused.call(), "should be pause")
    });
    it("SamplePriceFeedUser - updateOracleData, getCurrentData", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(PRICEFEED_QUERY_ID,_value, _power, _reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await priceFeedUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      let vars =  await priceFeedUser.getCurrentData();
      assert(vars[0] = _value);
      assert(vars[1] = _b0.timestamp, "timestamp should be correct")
      assert(vars[2] = _power)
      assert(vars[5] == _b1.timestamp)
    });
    it("SamplePriceFeedUser - getAllData, getValueCount", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _value = abiCoder.encode(["uint256"], [1000])
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let res = await submitData(PRICEFEED_QUERY_ID,_value, _power,_reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await priceFeedUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      assert(await priceFeedUser.getValueCount.call() == 1)
      await h.advanceTime(86400)
      let _b2= await h.getBlock()
      let _power2 = 6;
      let _value2 = abiCoder.encode(["uint256"], [2000])
      res = await submitData(PRICEFEED_QUERY_ID,_value2, _power2,_b2.timestamp - 60*61);
      let _attestData2= res[0]
      let _currentValidatorSet2 = res[1]
      let _sigs2 = res[2]
      await priceFeedUser.updateOracleData(_attestData2, _currentValidatorSet2, _sigs2);
      let _b3= await h.getBlock()
      let vars = await priceFeedUser.getAllData()
      assert(vars[0].value == _value);
      assert(vars[0].timestamp== (_b0.timestamp - 60*61 - 2) * 1000)
      assert(vars[0].aggregatePower == _power)
      assert(vars[0].relayTimestamp == _b1.timestamp)
      assert(vars[1].value == abiCoder.encode(["uint256"], [2000]));
      assert(vars[1].timestamp == (_b2.timestamp - 60*61 - 2) * 1000)
      assert(vars[1].aggregatePower == _power2)
      assert(vars[1].relayTimestamp == _b3.timestamp)
      assert(await priceFeedUser.getValueCount.call() == 2)
    });
  });
  describe("TestPriceFeedUser - Function Tests", function () {
    it("TestPriceFeedUser - Constructor", async function () {
      assert(await testPriceFeedUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await testPriceFeedUser.queryId.call() == PRICEFEED_QUERY_ID, "queryID should be set correct")
      assert(await testPriceFeedUser.guardian.call() == guardian.address);
    });
    it("TestPriceFeedUser - updateOracleData2", async function () {
      let _b0= await h.getBlock()
      let _power = 6;
      let _reportTimestamp = _b0.timestamp - 60*61//at least one hour old
      let _value = abiCoder.encode(["uint256"], [3000])
      let res = await submitData(PRICEFEED_QUERY_ID,_value, _power, _reportTimestamp);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await testPriceFeedUser.updateOracleData2(_attestData, _currentValidatorSet, _sigs, _b0.timestamp);
      let _b1= await h.getBlock()
      let vars = await testPriceFeedUser.getAllExtendedData()
      assert(vars[0].value == _value);
      assert(vars[0].timestamp == (_b0.timestamp - 60*61 - 2) * 1000);
      assert(vars[0].aggregatePower == _power);
      assert(vars[0].relayTimestamp == _b1.timestamp);
      assert(vars[0].previousTimestamp == 0);
      assert(vars[0].nextTimestamp == 0);
      assert(vars[0].initTimestamp == _b0.timestamp);
    });
  });
});
