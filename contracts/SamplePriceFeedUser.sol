// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./dependencies/IBlobstreamO.sol";

// For the ideal users of this contract, you want a decentralized price feed.  Speed is nice, but you want right over fast
// It is fast with consensus, but has a small delay for a dvm/ guardian to catch it if there are issues.  
// Ideally the user contract pauses with the oracle, or can run fine with no update. 

// this contract has a pause button from a guardian (no recovery, just pause, so user should have exit mechanism)
// the contract consensus or fallback to a 15 minute delay with 1/3 aggregate power
// data can only go forward in time and must be within 10 minutes old, must also prove it's latest value

//the user - needs a value feed to be right, but not in a rush.  example - ampleforth (daily vwap submitted within an hour) 
contract SamplePriceFeedUser {

    struct Data {
        uint256 value;
        uint256 timestamp;
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp;
        uint256 initTimestamp;
    }

    Data[] public data;
    IBlobstreamO public blobstreamO;


    address public guardian;
    bool public paused;
    bytes32 public queryId;
    uint256 public constant MAX_DATA_AGE = 4 hours;
    uint256 public constant MAX_ATTESTATION_AGE = 10 minutes;
    uint256 public constant OPTIMISTIC_DELAY = 15 minutes;

    event ContractPaused();
    event OracleUpdated(uint256 value, uint256 timestamp, uint256 aggregatePower);

    constructor(address _blobstreamO, bytes32 _queryId, address _guardian) {
        blobstreamO = IBlobstreamO(_blobstreamO);
        queryId = _queryId;
        guardian = _guardian;
    }

    function pauseContract() external{
        require(msg.sender == guardian, "should be guardian");
        paused = true;
        emit ContractPaused();
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        require(_attestData.queryId == queryId, "Invalid queryId");
        require(block.timestamp - _attestData.report.timestamp < MAX_DATA_AGE, "data too old");
        require(block.timestamp - _attestData.attestationTimestamp < MAX_ATTESTATION_AGE, "attestation too old");
        if (data.length > 0) {
            require(_attestData.report.timestamp > data[data.length - 1].timestamp, "report timestamp must increase");
        }
        if (_attestData.report.nextTimestamp != 0) {
            require(block.timestamp - _attestData.report.nextTimestamp < OPTIMISTIC_DELAY, "more recent optimistic report available");
        }
        if (_attestData.report.timestamp != _attestData.report.lastConsensusTimestamp) {
            // using optimistic data
            require(_attestData.report.lastConsensusTimestamp < _attestData.report.timestamp, "newer consensus data available");
            require(_attestData.attestationTimestamp - _attestData.report.timestamp >= OPTIMISTIC_DELAY, "dispute period not passed. request new attestations");
            require(_attestData.report.aggregatePower > blobstreamO.powerThreshold() / 2, "insufficient optimistic report power");
        } 
        blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _price = abi.decode(_attestData.report.value, (uint256));
        data.push(Data(
            _price, 
            _attestData.report.timestamp, 
            _attestData.report.aggregatePower, 
            _attestData.report.previousTimestamp, 
            _attestData.report.nextTimestamp,
            block.timestamp,
            _attestData.attestationTimestamp
        ));
    }

    function getAllData() external view returns(Data[] memory){
        return data;
    }
    
    function getCurrentData() external view returns (Data memory) {
        return data[data.length - 1];
    }

    function getValueCount() external view returns (uint256) {
        return data.length;
    }
}