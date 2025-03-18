// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../SamplePriceFeedUser.sol";

contract TestPriceFeedUser is SamplePriceFeedUser {
    constructor(address _blobstreamO, bytes32 _queryId, address _guardian) SamplePriceFeedUser(_blobstreamO, _queryId, _guardian) {}

    struct ExtendedData {
        uint256 value;
        uint256 timestamp;
        uint256 aggregatePower;
        uint256 previousTimestamp;
        uint256 nextTimestamp;
        uint256 relayTimestamp;
        uint256 initTimestamp;
    }

    ExtendedData[] public extendedData;

    function updateOracleData2(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs,
        uint256 _initTimestamp
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
                _initTimestamp
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