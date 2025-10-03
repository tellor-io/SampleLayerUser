// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const h = require("usingtellorlayer/src/helpers/evmHelpers.js")

const GUARDIAN_ADDRESS = "0x0000000000000000000000000000000000000000";
// for tellor mainnet, use "tellor-1"
// for tellor palmito testnet, use "layertest-4"
const TELLOR_CHAIN_ID = "tellor-1";

module.exports = buildModule("TellorDataBridgeModule", (m) => {
  const _validatorSetHashDomainSeparator = h.getDomainSeparator(TELLOR_CHAIN_ID);

  const guardianAddress = m.getParameter("guardianAddress", GUARDIAN_ADDRESS);
  const validatorSetHashDomainSeparator = m.getParameter("validatorSetHashDomainSeparator", _validatorSetHashDomainSeparator);

  const tellorDataBridge = m.contract("TellorDataBridge", [guardianAddress, validatorSetHashDomainSeparator]);

  return { tellorDataBridge };
}); 