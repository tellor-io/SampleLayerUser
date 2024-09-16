// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "../interfaces/IBlobstreamO.sol";

// this contract has a pause button from a guardian
// it does not fallback to anything, but if the price is not updated for 48 hours, the guardian can change the oracle address
// the contract consensus or fallback to a 24 hour delay with no power threshold (if not sure on support)
//data can only go forward in time and must be within 5 minutes old, , must prove it's latest value

contract SampleCPIUser {
     IBlobstreamO public blobstreamO;
    PriceData[] public priceData;
    bytes32 public queryId;
    bool public paused;
    address public guardian;

    event OracleUpdated(uint256 price, uint256 timestamp, uint256 aggregatePower);

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp;
    }

    constructor(address _blobstreamO, bytes32 _queryId, address _guardian) {
        blobstreamO = IBlobstreamO(_blobstreamO);
        queryId = _queryId;
        guardian = _guardian;
    }

    function pauseContract() external{
        require(msg.sender == guardian, "should be guardian");
        paused = true;
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        require(!paused, "contract paused");
        require(_attestData.queryId == queryId, "Invalid queryId");
        blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _price = abi.decode(_attestData.report.value, (uint256));
        if(_attestData.report.aggregatePower < blobstreamO.powerThreshold()){//if not consensus data
            require(_attestData.attestationTimestamp - _attestData.report.timestamp >= 15 minutes);//must be at least 15 minutes old
            require(_attestData.report.aggregatePower > blobstreamO.powerThreshold()/2);//must have >1/3 aggregate power
            require(_attestData.report.nextTimestamp == 0 ||
            _attestData.attestationTimestamp - _attestData.report.nextTimestamp < 15 minutes);//cannot have newer data you can push
        }else{
            require(_attestData.report.nextTimestamp == 0, "should be no newer timestamp"); // must push the newest data
        }
        require(block.timestamp - _attestData.attestationTimestamp < 10 minutes);//data cannot be more than 10 minutes old (the relayed attestation)
        require(_attestData.report.timestamp > priceData[priceData.length - 1].timestamp);//cannot go back in time
        priceData.push(PriceData(
            _price, 
            _attestData.report.timestamp, 
            _attestData.report.aggregatePower, 
            _attestData.report.previousTimestamp, 
            _attestData.report.nextTimestamp,
            block.timestamp
            )
        );
    }

    function getCurrentPriceData() external view returns (PriceData memory) {
        return priceData[priceData.length - 1];
    }

    function getAllPriceData() external view returns(PriceData[] memory){
        return priceData;
    }

    function getValueCount() external view returns (uint256) {
        return priceData.length;
    }
}