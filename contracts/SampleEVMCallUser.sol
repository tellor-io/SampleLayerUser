// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./dependencies/IBlobstreamO.sol";


// this contract has a pause button from a guardian
// a governance address can change the guardian or oracle with a 7 day delay
// the contract is always on a delay (no finality), so you have  1 hour delay with 1/3 aggregate power threshold 

//example user - liquity
contract SampleEVMCalleUser {
  IBlobstreamO public blobstreamO;
    PriceData[] public priceData;
    bytes32 public queryId;
    bool public paused;
    address public guardian;
    address public governance;

    //for updating
    address public proposedGuardian;
    address public proposedOracle;
    uint256 public updateGuardianTimestamp;
    uint256 public updateOracleTimestamp;

    event OracleUpdated(uint256 price, uint256 timestamp, uint256 aggregatePower);

    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp;
    }

    constructor(address _blobstreamO, bytes32 _queryId, address _guardian, address _governance) {
        blobstreamO = IBlobstreamO(_blobstreamO);
        queryId = _queryId;
        guardian = _guardian;
        governance = _governance;
    }

    function togglePause() external{
        require(msg.sender == guardian, "should be guardian");
        paused = !paused;
    }

    function changeGuardian(address _newGuardian) external{
        require(msg.sender == governance);
        if(proposedGuardian == address(0)){
            proposedGuardian = _newGuardian;
            updateGuardianTimestamp = block.timestamp;
        }else{
            require(block.timestamp - updateGuardianTimestamp > 7 days);
            guardian = proposedGuardian;
            proposedGuardian = address(0);
        }
    }

    function changeOracle(address _newOracle) external{
                require(msg.sender == governance);
        if(proposedOracle == address(0)){
            proposedOracle = _newOracle;
            updateOracleTimestamp = block.timestamp;
        }else{
            require(block.timestamp - updateOracleTimestamp > 7 days);
            blobstreamO = IBlobstreamO(proposedOracle);
            proposedOracle = address(0);
        }
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
        require(_attestData.attestationTimestamp - _attestData.report.timestamp >= 1 hours);//must be at least an hour old for finality
        require(_attestData.report.aggregatePower > blobstreamO.powerThreshold()/2);//must have >1/3 aggregate power
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