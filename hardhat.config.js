require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

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
      },
      {
        version: "0.8.22",
      },
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
    } ,
    sepolia: {
      url: `${process.env.NODE_URL_SEPOLIA_TESTNET}`,
      accounts: [process.env.TESTNET_PK],
      gas: 9000000,
      gasPrice: 5000000000
    },
  },
};
