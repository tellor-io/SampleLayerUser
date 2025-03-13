// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./dependencies/IBlobstreamO.sol";

// For the ideal users of this contract, speed is not important, but nice with conesnsus.
// Data is unique, so you don't have to worry about time series or changing, just whether its right

// this contract has a pause button from a guardian (if paused, it should settle invalid or go to governance)
// the contract consensus or fallback to a 24 hour delay with no aggregate power threshold (since you don't know what the question is)
// data age can be whenever (just one answer)

contract SamplePredictionMarketUser {
    
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
    uint256 public constant MS_PER_SECOND = 1000;

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
        require(block.timestamp - (_attestData.attestationTimestamp / MS_PER_SECOND) < 10 minutes, "attestation too old");
        blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        if(_attestData.report.aggregatePower < blobstreamO.powerThreshold()){//if not consensus data
            require((_attestData.attestationTimestamp - _attestData.report.timestamp) / MS_PER_SECOND >= 24 hours);//must be at least 24 hours old
        }
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