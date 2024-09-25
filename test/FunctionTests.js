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

describe("Sample Layer User - function tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  let accounts, cpiUser, evmCallUser, fallbackUser, predictionMarketUser, priceFeedUser, blobstream, guardian, governance, centralizedOracle
  beforeEach(async function () {

        // Contracts are deployed using the first signer/account by default
    accounts = await ethers.getSigners();
    guardian = accounts[1]

    let BlobstreamO = await ethers.getContractFactory("BlobstreamO");
    blobstream = await BlobstreamO.deploy(guardian.address);

    let User = await ethers.getContractFactory("SampleCPIUser");
    cpiUser= await User.deploy(blobstream.target,CPI_QUERY_ID,guardian.address) ;

    governance = accounts[2]
    User = await ethers.getContractFactory("SampleEVMCallUser");
    evmCallUser= await User.deploy(blobstream.target,EVMCALL_QUERY_ID,guardian.address, governance.address);

    centralizedOracle = accounts[3]
    User = await ethers.getContractFactory("SampleFallbackOracleUser");
    fallbackUser= await User.deploy(blobstream.target,PRICEFEED_QUERY_ID,guardian.address, governance.address, centralizedOracle.address);

    User = await ethers.getContractFactory("SamplePredictionMarketUser");
    predictionMarketUser= await User.deploy(blobstream.target,PREDICTIONMARKET_QUERY_ID,guardian.address);

    User = await ethers.getContractFactory("SamplePriceFeedUser");
    priceFeedUser = await User.deploy(blobstream.target,PRICEFEED_QUERY_ID,guardian.address);
  })

  console.log("SampleCPIUser - Function Tests")
    it("SampleCPIUser - Constructor", async function () {
      assert(await cpiUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await cpiUser.queryId.call() == CPI_QUERY_ID, "queryID should be set correct")
      assert(await cpiUser.guardian.call() == guardian.address);
    });
    it("SampleCPIUser - pauseContract", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleCPIUser - updateOracleData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleCPIUser - getAllData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleCPIUser - getCurrentData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleCPIUser - getValueCount", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
  console.log("SampleEVMCallUser - Function Tests")
    it("SampleEVMCallUser -Constructor", async function () {
      assert(await evmCallUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await evmCallUser.queryId.call() == EVMCALL_QUERY_ID, "queryID should be set correct")
      assert(await evmCallUser.guardian.call() == guardian.address);
      assert(await evmCallUser.governance.call() == governance.address, "governance should set")
    });
    it("SampleEVMCallUser -changeGuardian", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser -changeOracle", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser - togglePause", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser - updateOracleData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser - getAllData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser - getCurrentData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleEVMCallUser - getValueCount", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
  console.log("SampleFallbackOracleUser")
    it("SampleFallbackOracleUser - Constructor", async function () {
      assert(await fallbackUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await fallbackUser.queryId.call() == PRICEFEEDL_QUERY_ID, "queryID should be set correct")
      assert(await fallbackUser.guardian.call() == guardian.address);
      assert(await fallbackUser.governance.call() == governance.address, "governance should set")
      assert(await fallbackUser.centralizedOracle.call() == centralizedOracle.address(), "centralized oracle should be set")
    });
    it("SampleFallbackOracleUser - changeFallback", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - changeGuardian", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - changeOracle", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - togglePause", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - updateOracleData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - getAllData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - getCurrentData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SampleFallbackOracleUser - getValueCount", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
  console.log("SamplePredictionMarketUser - Function Tests")
    it("SamplePredictionMarketUser - Constructor", async function () {
      assert(await predictionMarketUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await predictionMarketUser.queryId.call() == PREDICTIONMARKET_QUERY_ID, "queryID should be set correct")
      assert(await predictionMarketUser.guardian.call() == guardian.address);
    });
    it("SamplePredictionMarketUser - pauseContract", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePredictionMarketUser - updateOracleData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePredictionMarketUser - getAllData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePredictionMarketUser - getCurrentData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePredictionMarketUser - getValueCount", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
  console.log("SamplePriceFeedUser - Function Tests")
    it("SamplePriceFeedUser - Constructor", async function () {
      console.log(await priceFeedUser.blobstreamO.call() , blobstream.target)
      assert(await priceFeedUser.blobstreamO.call() == blobstream.target, "blobstream should be set right")
      assert(await priceFeedUser.queryId.call() == PRICEFEED_QUERY_ID, "queryID should be set correct")
      assert(await priceFeedUser.guardian.call() == guardian.address);
    });
    it("SamplePriceFeedUser - pauseContract", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePriceFeedUser - updateOracleData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePriceFeedUser - getAllData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePriceFeedUser - getCurrentData", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
    it("SamplePriceFeedUser - getValueCount", async function () {
      
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });
});
