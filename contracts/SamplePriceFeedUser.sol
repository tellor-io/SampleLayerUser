// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

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
    }

    Data[] public data;
    IBlobstreamO public blobstreamO;


    address public guardian;
    bool public paused;
    bytes32 public queryId;

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
        require(!paused, "contract paused");
        require(_attestData.queryId == queryId, "Invalid queryId");
        blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        if(_attestData.report.aggregatePower < blobstreamO.powerThreshold()){//if not consensus data
            require(_attestData.attestationTimestamp - _attestData.report.timestamp >= 15 minutes);//must be at least 15 minutes old
            require(_attestData.report.aggregatePower > blobstreamO.powerThreshold()/2);//must have >1/3 aggregate power
            require(_attestData.report.nextTimestamp == 0 ||
            _attestData.attestationTimestamp - _attestData.report.nextTimestamp < 15 minutes);//cannot have newer data you can push
        }else{
            require(_attestData.report.nextTimestamp == 0, "should be no newer timestamp"); // must push the newest data
        }
        require(block.timestamp - _attestData.attestationTimestamp < 10 minutes);//data cannot be more than 10 minutes old (the relayed attestation)
        require(_attestData.report.timestamp > data[data.length - 1].timestamp);//cannot go back in time
        data.push(Data(
            _value, 
            _attestData.report.timestamp, 
            _attestData.report.aggregatePower, 
            _attestData.report.previousTimestamp, 
            _attestData.report.nextTimestamp,
            block.timestamp
            )
        );
        emit OracleUpdated(_value,_attestData.report.timestamp, _attestData.report.aggregatePower);
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