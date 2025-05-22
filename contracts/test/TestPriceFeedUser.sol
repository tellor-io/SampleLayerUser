// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../SamplePriceFeedUser.sol";

contract TestPriceFeedUser is SamplePriceFeedUser {
    constructor(address _dataBridge, bytes32 _queryId, address _guardian) SamplePriceFeedUser(_dataBridge, _queryId, _guardian) {}

    struct ExtendedData {
        uint256 value;
        uint256 timestamp; // aggregation block timestamp
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp; // block timestamp of when data included on evm chain
        uint256 initTimestamp; // if a tipped query, this is timestamp of when user decides to tip
        uint256 readyToRelayTimestamp; // time when aggregate and attestations are ready to be relayed
    }

    ExtendedData[] public extendedData;

    function updateOracleData2(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs,
        uint256 _initTimestamp,
        uint256 _readyToRelayTimestamp
    ) external {
        _verifyOracleData(_attestData, _currentValidatorSet, _sigs);
        uint256 price = abi.decode(_attestData.report.value, (uint256));
        extendedData.push(
            ExtendedData(
                price, 
                _attestData.report.timestamp, 
                _attestData.report.aggregatePower, 
                _attestData.report.previousTimestamp, 
                _attestData.report.nextTimestamp, 
                block.timestamp, 
                _initTimestamp,
                _readyToRelayTimestamp
            )
        );
    }


    function getAllExtendedData() external view returns (ExtendedData[] memory) {
        return extendedData;
    }

    function getExtendedDataLength() external view returns (uint256) {
        return extendedData.length;
    }

    function getExtendedData(uint256 _index) external view returns (ExtendedData memory) {
        return extendedData[_index];
    }
}