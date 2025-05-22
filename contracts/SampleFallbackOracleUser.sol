// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "usingtellorlayer/contracts/interfaces/IBlobstreamO.sol";

// For the ideal users of this contract, speed is ideal, but you can have a little delay if something breaks. 
// The centralized oracle is known, so the bigger risk is liveness vs them attacking you (e.g. LINK or Coinbase)
// so it allows you to fallback to tellor, but has a governance contract for changingthe centralized oracle or guardian

// this contract has a pause button from a guardian.  Just pauses centralized oracle for 24 hours (then 24 hr before can pause again)
// has governance contract to upgrade centralized oracle
//  uses a centralized oracle, but fallsback IF:
    // oracle not updated in 1 hour
    // oracle frozen by guardian

// for our oracle, if no updates for 7 days, the guardian can change the fallback oracle address
// the contract is consensus or fallback to a 15 minute delay with 1/3 aggregate power threshold (assume a large pair, should be smaller if less supported)
// data must be newer than 5 minutes ago, must prove it's latest value

//example user - liquity
contract SampleFallbackOracleUser {
    
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

    address public centralizedOracle;
    address public guardian;
    address public governance;
    bool public paused;
    bytes32 public queryId;
    uint256 public pauseTimestamp;
    uint256 public constant MS_PER_SECOND = 1000;
    //for updating
    address public proposedGuardian;
    address public proposedOracle;
    uint256 public updateGuardianTimestamp;
    uint256 public updateOracleTimestamp;

    event ContractPaused();
    event FallbackChanged(address newFallback);
    event GuardianChange(uint256 _timeWillChange, address _newGuardian);
    event OracleChange(uint256 _timeWillChange, address _newOracle);
    event OracleUpdated(uint256 value, uint256 timestamp, uint256 aggregatePower);


    constructor(address _blobstreamO, bytes32 _queryId, address _guardian,address _governance, address _centralizedOracle) {
        blobstreamO = IBlobstreamO(_blobstreamO);
        queryId = _queryId;
        guardian = _guardian;
        governance = _governance;
        centralizedOracle = _centralizedOracle;
    }

    function changeFallback(address _newOracle) external{
        require(data.length > 0);
        require(msg.sender == guardian);
        require(block.timestamp - (data[data.length - 1].timestamp / MS_PER_SECOND) > 7 days);
        blobstreamO = IBlobstreamO(_newOracle);
        emit FallbackChanged(_newOracle);
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
            centralizedOracle = proposedOracle;
            emit OracleChange(block.timestamp, proposedOracle);
            proposedOracle = address(0);
        }
    }

    function pauseContract() external{
        require(block.timestamp - pauseTimestamp > 2 days, "must be 24 hours between pauses");
        require(msg.sender == guardian, "should be guardian");
        pauseTimestamp = block.timestamp;
        emit ContractPaused();
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        require(data.length == 0 || _attestData.report.timestamp > data[data.length - 1].timestamp, "cannot go back in time");//cannot go back in time
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        if(msg.sender == centralizedOracle){
            if((data.length == 0 || (block.timestamp - pauseTimestamp) < 24 hours)){
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
                return;
            }
        }
        else if((block.timestamp - (data[data.length - 1].timestamp / MS_PER_SECOND)) > 1 hours){
            require(_attestData.queryId == queryId, "Invalid queryId");
            blobstreamO.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
            if(_attestData.report.aggregatePower < blobstreamO.powerThreshold()){//if not consensus data
                require((_attestData.attestationTimestamp - _attestData.report.timestamp) / MS_PER_SECOND >= 15 minutes);//must be at least 15 minutes old
                require(_attestData.report.aggregatePower > blobstreamO.powerThreshold()/2);//must have >1/3 aggregate power
                require(_attestData.report.nextTimestamp == 0 ||
                (_attestData.attestationTimestamp - _attestData.report.nextTimestamp) / MS_PER_SECOND < 15 minutes);//cannot have newer data you can push
            }else{
                require(_attestData.report.nextTimestamp == 0, "should be no newer timestamp"); // must push the newest data
            }
            require(block.timestamp - (_attestData.attestationTimestamp / MS_PER_SECOND) < 5 minutes);//data cannot be more than 5 minutes old (the relayed attestation)
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