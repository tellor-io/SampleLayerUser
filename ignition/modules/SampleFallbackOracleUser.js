// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DATA_BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000000";
const QUERY_ID = "0x0000000000000000000000000000000000000000000000000000000000000000";
const GUARDIAN_ADDRESS = "0x0000000000000000000000000000000000000000";
const GOVERNANCE_ADDRESS = "0x0000000000000000000000000000000000000000";
const CENTRALIZED_ORACLE_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = buildModule("SampleFallbackOracleUserModule", (m) => {
  const dataBridgeAddress = m.getParameter("dataBridgeAddress", DATA_BRIDGE_ADDRESS);
  const queryId = m.getParameter("queryId", QUERY_ID);
  const guardianAddress = m.getParameter("guardianAddress", GUARDIAN_ADDRESS);
  const governanceAddress = m.getParameter("governanceAddress", GOVERNANCE_ADDRESS);
  const centralizedOracleAddress = m.getParameter("centralizedOracleAddress", CENTRALIZED_ORACLE_ADDRESS);

  const sampleFallbackOracleUser = m.contract("SampleFallbackOracleUser", [
    dataBridgeAddress, 
    queryId, 
    guardianAddress, 
    governanceAddress, 
    centralizedOracleAddress
  ]);

  return { sampleFallbackOracleUser };
});
