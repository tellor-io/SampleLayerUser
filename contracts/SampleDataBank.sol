// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "usingtellorlayer/contracts/interfaces/ITellorDataBridge.sol";
// This contract is used to store data for multiple price feeds. It prioritizes faster consensus data, but falls back to
// optimistic data if the consensus data is not available.
contract SampleDataBank {

    struct AggregateData {
        bytes value; // the aggregated oracle value
        uint256 power; // the aggregate power of the reporters
        uint256 attestationTimestamp; // the timestamp of the attestation
        uint256 relayTimestamp; // the timestamp of the relay
    }

    ITellorDataBridge public dataBridge;
    mapping(bytes32 => uint256[]) public timestamps;
    mapping(bytes32 => mapping(uint256 => AggregateData)) public data; //queryId -> timestamp -> value
    uint256 public constant MAX_DATA_AGE = 4 hours; // the max age of relayed data
    uint256 public constant MAX_ATTESTATION_AGE = 10 minutes; // the max age of an attestation
    uint256 public constant OPTIMISTIC_DELAY = 15 minutes; // the min time from report to attestation for nonconsensus data
    uint256 public constant MS_PER_SECOND = 1000; // the number of milliseconds in a second

    event OracleUpdated(bytes32 indexed queryId, bytes value, uint256 power);

    constructor(address _dataBridge) {
        dataBridge = ITellorDataBridge(_dataBridge);
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        _verifyOracleData(
            _attestData,
            _currentValidatorSet,
            _sigs
        );
        timestamps[_attestData.queryId].push(_attestData.report.timestamp);
        data[_attestData.queryId][_attestData.report.timestamp] = AggregateData(
            _attestData.report.value, 
            _attestData.report.aggregatePower, 
            _attestData.attestationTimestamp, 
            block.timestamp
        );
        emit OracleUpdated(_attestData.queryId, _attestData.report.value, _attestData.report.aggregatePower);
    }

    function getCurrentData(bytes32 _queryId) external view returns (AggregateData memory) {
        return data[_queryId][timestamps[_queryId].length - 1];
    }

    function getValueCount(bytes32 _queryId) external view returns (uint256) {
        return timestamps[_queryId].length;
    }

    function _verifyOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) internal view {
        require(block.timestamp - (_attestData.report.timestamp / MS_PER_SECOND) < MAX_DATA_AGE, "data too old");
        require(block.timestamp - (_attestData.attestationTimestamp / MS_PER_SECOND) < MAX_ATTESTATION_AGE, "attestation too old");
        uint256[] memory _timestamps = timestamps[_attestData.queryId];
        if (_timestamps.length > 0) {
            require(_attestData.report.timestamp > _timestamps[_timestamps.length - 1], "report timestamp must increase");
        }
        if (_attestData.report.nextTimestamp != 0) {
            require(block.timestamp - (_attestData.report.nextTimestamp / MS_PER_SECOND) < OPTIMISTIC_DELAY, "more recent optimistic report available");
        }
        if (_attestData.report.timestamp != _attestData.report.lastConsensusTimestamp) {
            // using optimistic data
            require(_attestData.report.lastConsensusTimestamp < _attestData.report.timestamp, "newer consensus data available");
            require((_attestData.attestationTimestamp - _attestData.report.timestamp) / MS_PER_SECOND >= OPTIMISTIC_DELAY, "dispute period not passed. request new attestations");
            require(_attestData.report.aggregatePower > dataBridge.powerThreshold() / 2, "insufficient optimistic report power");
        } 
        dataBridge.verifyOracleData(_attestData, _currentValidatorSet, _sigs);
    }
}