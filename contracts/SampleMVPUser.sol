// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "usingtellorlayer/contracts/interfaces/ITellorDataBridge.sol";

// This contract shows the minimal version of a tellor oracle user

contract TellorUser {
    ITellorDataBridge public dataBridge;
    bytes32 public queryId;
    OracleData[] public oracleData;

    struct OracleData {
        uint256 value;
        uint256 timestamp;
    }

    constructor(address _dataBridge, bytes32 _queryId) {
        dataBridge = ITellorDataBridge(_dataBridge);
        queryId = _queryId;
    }

    function updateOracleData(
        OracleAttestationData calldata _attestData,
        Validator[] calldata _currentValidatorSet,
        Signature[] calldata _sigs
    ) external {
        // make sure the data is valid tellor data
        dataBridge.verifyOracleData(_attestData, _currentValidatorSet, _sigs);

        // make sure reporters have something at stake
        require(_attestData.report.aggregatePower > 0, "no power");

        // decode the data and store it
        uint256 _value = abi.decode(_attestData.report.value, (uint256));
        oracleData.push(OracleData(_value, _attestData.report.timestamp));
    }

    function getCurrentData() external view returns (OracleData memory) {
        return oracleData[oracleData.length - 1];
    }

    function getValueCount() external view returns (uint256) {
        return oracleData.length;
    }
}