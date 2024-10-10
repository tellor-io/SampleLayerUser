var assert = require('assert');
const abiCoder = new ethers.AbiCoder();
const { expect } = require("chai");
const h = require("./helpers/evmHelpers.js");


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
  let accounts, cpiUser, evmCallUser, fallbackUser, predictionMarketUser, priceFeedUser, blobstream, guardian, governance, centralizedOracle
  let threshold, val1, val2, initialPowers, initialValAddrs;

  async function  submitData(queryId, value, aggregatePower){
    //e.g. value = abiCoder.encode(["uint256"], [2000])
    // e.g. queryId = h.hash("myquery")
    blocky = await h.getBlock()
    timestamp = (blocky.timestamp - 2)
    attestTimestamp = blocky.timestamp
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
        attestTimestamp
    )
    currentValSetArray = await h.getValSetStructArray(initialValAddrs, initialPowers)
    sig1 = await h.layerSign(dataDigest, val1.privateKey)
    sig2 = await h.layerSign(dataDigest, val2.privateKey)
    sig3 = await h.layerSign(dataDigest, val3.privateKey)
    sigStructArray = await h.getSigStructArray([ethers.Signature.from(sig1), ethers.Signature.from(sig2),ethers.Signature.from(sig3)])
    //console.log(sigStructArray)
    oracleDataStruct = await h.getOracleDataStruct(
        queryId,
        value,
        timestamp,
        aggregatePower,
        previousTimestamp,
        nextTimestamp,
        attestTimestamp
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
  })

  console.log("SampleCPIUser - Function Tests")
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
      let res = await submitData(CPI_QUERY_ID,_value, _power);
      let _attestData = res[0]
      let _currentValidatorSet = res[1]
      let _sigs = res[2]
      await cpiUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
      let _b1= await h.getBlock()
      let vars =  await cpiUser.getCurrentData();
      console.log(vars)
      assert(vars[0] = _value);
      console.log(vars[1].time, _b0.timestamp)
      assert(vars[1] = _b0.timestamp, "timestamp should be correct")
      assert(vars[2] = _power)
      assert(vars[5] == _b1.timestamp)
    });
  //   it("SampleCPIUser - getAllData", async function () {
  //     let _b0= h.getBlock
  //     let _power = 100;
  //     let _value = abiCoder.encode(["uint256"], [1000])
  //     let _attestData,_currentValidatorSet,_sigs
  //     _attestData,_currentValidatorSet,_sigs = await submitData(CPI_QUERY_ID,_value)
  //     await cpiUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
  //     let _b2= h.getBlock
  //     let _power2 = 100;
  //     let _value2 = abiCoder.encode(["uint256"], [2000])
  //     let _attestData2,_currentValidatorSet2,_sigs2
  //     _attestData2,_currentValidatorSet2,_sigs2 = await submitData(CPI_QUERY_ID,_value)
  //     await cpiUser.updateOracleData(_attestData, _currentValidatorSet, _sigs);
  //     let vars = await cpiUser.getAllData()
  //     assert(vars[0].value = _value);
  //     assert(vars[0].time = _b0.timestamp)
  //     assert(vars[0].aggregatePower = _power)
  //     assert(vars[0].relayTimestamp == _b1.timestamp)
  //     assert(vars[1].value = _value2);
  //     assert(vars[1].time = _b2.timestamp)
  //     assert(vars[1].aggregatePower = _power2)
  //     assert(vars[1].relayTimestamp == _b2.timestamp)
  //   });
  //   it("SampleCPIUser - getCurrentData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleCPIUser - getValueCount", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  // console.log("SampleEVMCallUser - Function Tests")
  //   it("SampleEVMCallUser -Constructor", async function () {
  //     assert(await evmCallUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
  //     assert(await evmCallUser.queryId.call() == EVMCALL_QUERY_ID, "queryID should be set correct")
  //     assert(await evmCallUser.guardian.call() == guardian.address);
  //     assert(await evmCallUser.governance.call() == governance.address, "governance should set")
  //   });
  //   it("SampleEVMCallUser -changeGuardian", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser -changeOracle", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser - togglePause", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser - updateOracleData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser - getAllData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser - getCurrentData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleEVMCallUser - getValueCount", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  // console.log("SampleFallbackOracleUser")
  //   it("SampleFallbackOracleUser - Constructor", async function () {
  //     assert(await fallbackUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
  //     assert(await fallbackUser.queryId.call() == PRICEFEEDL_QUERY_ID, "queryID should be set correct")
  //     assert(await fallbackUser.guardian.call() == guardian.address);
  //     assert(await fallbackUser.governance.call() == governance.address, "governance should set")
  //     assert(await fallbackUser.centralizedOracle.call() == centralizedOracle.address(), "centralized oracle should be set")
  //   });
  //   it("SampleFallbackOracleUser - changeFallback", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - changeGuardian", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - changeOracle", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - togglePause", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - updateOracleData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - getAllData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - getCurrentData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SampleFallbackOracleUser - getValueCount", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  // console.log("SamplePredictionMarketUser - Function Tests")
  //   it("SamplePredictionMarketUser - Constructor", async function () {
  //     assert(await predictionMarketUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
  //     assert(await predictionMarketUser.queryId.call() == PREDICTIONMARKET_QUERY_ID, "queryID should be set correct")
  //     assert(await predictionMarketUser.guardian.call() == guardian.address);
  //   });
  //   it("SamplePredictionMarketUser - pauseContract", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePredictionMarketUser - updateOracleData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePredictionMarketUser - getAllData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePredictionMarketUser - getCurrentData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePredictionMarketUser - getValueCount", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  // console.log("SamplePriceFeedUser - Function Tests")
  //   it("SamplePriceFeedUser - Constructor", async function () {
  //     console.log(await priceFeedUser.blobstreamO.call() , blobstream.target)
  //     assert(await priceFeedUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
  //     assert(await priceFeedUser.queryId.call() == PRICEFEED_QUERY_ID, "queryID should be set correct")
  //     assert(await priceFeedUser.guardian.call() == guardian.address);
  //   });
  //   it("SamplePriceFeedUser - pauseContract", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePriceFeedUser - updateOracleData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePriceFeedUser - getAllData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePriceFeedUser - getCurrentData", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
  //   it("SamplePriceFeedUser - getValueCount", async function () {
      
  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });
});
