// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "usingtellorlayer/contracts/interfaces/ITellorDataBridge.sol";

// For the ideal users of this contract, you can pause and wait without much problem, but there's a huge risk if a wrong value gets through
// so you can pause it, the system always uses a delay (so a guardian can stop it or users exit)

// this contract has a pause button from a guardian
// a governance address can change the guardian or oracle with a 7 day delay
// the contract is always on a delay (no finality), so you have  1 hour delay with 1/3 aggregate power threshold 

//example user - charon
contract SampleEVMCallUser {

    struct Data {
        uint256 value;
        uint256 timestamp;
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp;
    }

    Data[] public data;
    ITellorDataBridge public dataBridge;

    address public guardian;
    address public governance;
    bool public paused;
    bytes32 public queryId;
    uint256 public constant MS_PER_SECOND = 1000;
    uint256 public constant MAX_DATA_AGE = 4 hours;
    uint256 public constant MAX_ATTESTATION_AGE = 10 minutes;
    uint256 public constant OPTIMISTIC_DELAY = 1 hours;

    //for updating
    address public proposedGuardian;
    address public proposedOracle;
    uint256 public updateGuardianTimestamp;
    uint256 public updateOracleTimestamp;

    event GuardianChange(uint256 _timeWillChange, address _newGuardian);
    event OracleChange(uint256 _timeWillChange, address _newOracle);
    event OracleUpdated(uint256 _value, uint256 _timestamp, uint256 _aggregatePower);
    event PauseToggled(bool _isPaused);

    constructor(address _dataBridge, bytes32 _queryId, address _guardian, address _governance) {
        dataBridge = ITellorDataBridge(_dataBridge);
        queryId = _queryId;
        guardian = _guardian;
        governance = _governance;
    }

    function changeGuardian(address _newGuardian) external{
        if(proposedGuardian == address(0)){
            require(msg.sender == governance);
            proposedGuardian = _newGuardian;
            updateGuardianTimestamp = block.timestamp;
            emit GuardianChange(updateGuardianTimestamp, _newGuardian);
        }else{
            require(block.timestamp - updateGuardianTimestamp > 7 days);
            guardian = proposedGuardian;
            proposedGuardian = address(0);
            emit GuardianChange(block.timestamp, guardian);
        }
    }

    function changeOracle(address _newOracle) external{
        if(proposedOracle == address(0)){
            require(msg.sender == governance);
            proposedOracle = _newOracle;
            updateOracleTimestamp = block.timestamp;
            emit OracleChange(updateOracleTimestamp, _newOracle);
        }else{
            require(block.timestamp - updateOracleTimestamp > 7 days);
            dataBridge = ITellorDataBridge(proposedOracle);
            emit OracleChange(block.timestamp, proposedOracle);
            proposedOracle = address(0);
        }
    }

    function togglePause() external{
        require(msg.sender == guardian, "should be guardian");
        paused = !paused;
        emit PauseToggled(paused);
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        require(!paused, "contract paused");
        require(_attestData.queryId == queryId, "Invalid queryId");
        require(block.timestamp - (_attestData.attestationTimestamp / MS_PER_SECOND) < MAX_ATTESTATION_AGE, "attestation too old");
        require(block.timestamp - (_attestData.report.timestamp / MS_PER_SECOND) < MAX_DATA_AGE, "data too old");
        dataBridge.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        require((_attestData.attestationTimestamp - _attestData.report.timestamp) / MS_PER_SECOND >= OPTIMISTIC_DELAY);//must be at least an hour old for finality
        require(_attestData.report.aggregatePower > dataBridge.powerThreshold() / 2);//must have >1/3 aggregate power
        if(data.length > 0 ){
            require(_attestData.report.timestamp > data[data.length - 1].timestamp);//cannot go back in time
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