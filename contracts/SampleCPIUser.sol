// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "./dependencies/IBlobstreamO.sol";

// For the ideal users of this contract, you have low risk in not changing a good value, inflation rarely sky rockets, but huge risk if it is uncapped in changes
// so you can pause it, the system limits an update to 10% change per day (in case even guardian fails)

// this contract has a pause button from a guardian
// the contract consensus or fallback to a 24 hour delay with no power threshold (if not sure on support)
// system limited to 10% , can only update value once a day (inlfation numbers don't change that much)
// data can only go forward in time and must be within 15 minutes old
//  data must prove it's latest value
contract SampleCPIUser {

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
    event OracleUpdated(uint256 _value, uint256 _timestamp, uint256 _aggregatePower);


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
        require(block.timestamp - data[data.length - 1].timestamp > 1 days); //can only be updated once daily
        require(_attestData.queryId == queryId, "Invalid queryId");
        blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        if(_attestData.report.aggregatePower < blobstreamO.powerThreshold()){//if not consensus data
            require(_attestData.attestationTimestamp - _attestData.report.timestamp >= 24 hours);//must be at least one day old
            require(_attestData.report.nextTimestamp == 0 ||
            _attestData.attestationTimestamp - _attestData.report.nextTimestamp < 24 hours);//cannot have newer data you can push
        }else{
            require(_attestData.report.nextTimestamp == 0, "should be no newer timestamp"); // must push the newest data
        }
        require(block.timestamp - _attestData.attestationTimestamp < 15 minutes);//data cannot be more than 10 minutes old (the relayed attestation)
        require(_attestData.report.timestamp > data[data.length - 1].timestamp);//cannot go back in time
        if(_percentChange(data[data.length - 1].value,_value) > 10){
            if(data[data.length - 1].value > _value){
                _value = 90 * data[data.length - 1].value / 100 ;
            }else{
                _value = 110 * data[data.length - 1].value / 100; 
            }
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

    function _percentChange(uint256 _a, uint256 _b) internal pure returns(uint256 _res){
        if(_a > _b){
            _res = (1000000 * _a - 1000000 * _b) / _a;
        }
        else{
            _res = (1000000 * _b - 1000000 * _a) / _b;
        }
        _res = 100 * _res / 1000000;
    }
}