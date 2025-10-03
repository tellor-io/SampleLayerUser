// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./interfaces/IDataBankPlayground.sol";

/**
 * @title PlaygroundUser
 * @dev This contract is used to retrieve data from the tellor data bank
 */
contract PlaygroundUser {
    IDataBankPlayground public dataBank;
    bytes32 public queryId;
    uint256 public savedPrice;
    uint256 public savedTimestamp;

    /**
     * @dev constructor
     * @param _dataBank the address of the data bank
     * @param _queryId the unique identifier for the data to retrieve
     */
    constructor(address _dataBank, bytes32 _queryId) {
        dataBank = IDataBankPlayground(_dataBank);
        queryId = _queryId;
    }

    /**
     * @dev retrieves data from the data bank
     */
    function retrieveData() external {
        IDataBankPlayground.AggregateData memory _aggregateData = dataBank.getCurrentAggregateData(queryId);
        require(_aggregateData.aggregateTimestamp > 0, "No data available");
        require(savedTimestamp == 0 || _aggregateData.aggregateTimestamp > savedTimestamp, "No new data available");
        // oracle data encoded as bytes, decode to uint256
        savedPrice = abi.decode(_aggregateData.value, (uint256));
        // aggregate timestamp is in milliseconds, divide by 1000 to get seconds
        savedTimestamp = _aggregateData.aggregateTimestamp / 1000;
    }
}