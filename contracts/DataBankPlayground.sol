// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "usingtellorlayer/contracts/interfaces/ITellorDataBridge.sol";

/**
 @author Tellor Inc.
 @title DataBankPlayground
 @dev This contract is used to store data for multiple data feeds. It has no data bridge validation,
 and is used for testing purposes.
*/
contract DataBankPlayground {
    // Storage
    mapping(bytes32 => AggregateData[]) public data; // queryId -> aggregate data array

    struct AggregateData {
        bytes value; // the value of the asset
        uint256 power; // the aggregate power of the reporters
        uint256 aggregateTimestamp; // the timestamp of the aggregate
        uint256 attestationTimestamp; // the timestamp of the attestation
        uint256 relayTimestamp; // the timestamp of the relay
    }

    // Events
    event OracleUpdated(bytes32 indexed queryId, OracleAttestationData attestData);

    // Functions
    /**
     * @dev updates oracle data with new attestation data after verification
     * @param _attestData the oracle attestation data to be stored
     * note: _currentValidatorSet array of current validators (unused for testing)
     * note: _sigs array of validator signatures (unused for testing)
     */
    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata /* _currentValidatorSet */,
        Signature[] calldata /* _sigs */
    ) external {
        // Skips verification for testing purposes
        // dataBridge.verifyOracleData(_attestData, _currentValidatorSet, _sigs);

        data[_attestData.queryId].push(AggregateData(
            _attestData.report.value, 
            _attestData.report.aggregatePower, 
            _attestData.report.timestamp,
            _attestData.attestationTimestamp, 
            block.timestamp
        ));
        emit OracleUpdated(_attestData.queryId, _attestData);
    }

    // Getter functions

    /**
     * @dev returns the aggregate data for a given query ID and index
     * @param _queryId the query ID to get the aggregate data for
     * @param _index the index of the aggregate data to get
     * @return _aggregateData the aggregate data
     */
    function getAggregateByIndex(bytes32 _queryId, uint256 _index) external view returns (AggregateData memory _aggregateData) {
        return data[_queryId][_index];
    }

    /**
     * @dev returns the total number of aggregate values
     * @param _queryId the query ID to get the aggregate value count for
     * @return number of aggregate values stored
     */
    function getAggregateValueCount(bytes32 _queryId) external view returns (uint256) {
        return data[_queryId].length;
    }

    /**
     * @dev returns the current aggregate data for a given query ID
     * @param _queryId the query ID to get the current aggregate data for
     * @return _aggregateData the current aggregate data
     */
    function getCurrentAggregateData(bytes32 _queryId) external view returns (AggregateData memory _aggregateData) {
        return _getCurrentAggregateData(_queryId);
    }

    // Internal functions
    /**
     * @dev internal function to get the current aggregate data for a query ID
     * @param _queryId the query ID to get the current aggregate data for
     * @return _aggregateData the current aggregate data
     */
    function _getCurrentAggregateData(bytes32 _queryId) internal view returns (AggregateData memory _aggregateData) {
        if (data[_queryId].length == 0) {
            return (AggregateData(bytes(""), 0, 0, 0, 0));
        }
        _aggregateData = data[_queryId][data[_queryId].length - 1];
        return _aggregateData;
    }
}