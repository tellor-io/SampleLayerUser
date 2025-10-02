// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IDataBankPlayground {
    struct AggregateData {
        bytes value;
        uint256 power;
        uint256 aggregateTimestamp;
        uint256 attestationTimestamp;
        uint256 relayTimestamp;
    }

    function getCurrentAggregateData(bytes32 _queryId) external view returns (AggregateData memory _aggregateData);
    function getAggregateByIndex(bytes32 _queryId, uint256 _index) external view returns (AggregateData memory _aggregateData);
    function getAggregateValueCount(bytes32 _queryId) external view returns (uint256);
}