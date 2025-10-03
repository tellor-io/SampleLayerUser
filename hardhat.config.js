require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Get environment variables with fallbacks to avoid errors during test discovery
const INFURA_API_KEY = vars.get("INFURA_API_KEY", "");
const TESTNET_PK = vars.get("TESTNET_PK", "0x0000000000000000000000000000000000000000000000000000000000000001");
const MAINNET_PK = vars.get("MAINNET_PK", "0x0000000000000000000000000000000000000000000000000000000000000001");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY", "");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 300,
          },
        },
      }
    ],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          "nick lucian brenda kevin sam fiscal patch fly damp ocean produce wish",
        count: 40,
      },
      allowUnlimitedContractSize: true
    },
    mainnet: {
      url: `${process.env.NODE_URL_SAGA_EVM}`,
      accounts: [MAINNET_PK],
      gas: 10000000,
      gasPrice: 5000000000
    },
    sepolia: {
      url: INFURA_API_KEY ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}` : "",
      accounts: TESTNET_PK ? [TESTNET_PK] : [],
      gas: 9000000,
      gasPrice: 5000000000
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
