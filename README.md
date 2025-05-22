
# Sample Projects Using Tellor Layer <a name="sample"> </a>

<b>The Tellor oracle</b> is a decentralized oracle. The tellor oracle chain, Layer, provides an option for contracts to interact securely with and obtain data from off-chain.

This repository aims to provide an updated version of various examples of sample code that uses Tellor.  Note that there are different checks and best practices depending on the specific use case and user profile.  The examples specified in this repo are: 
- Price feeds
- Slow data (e.g. the CPI thats updated monthly)
- Prediction Markets
- Tellor as a fallback to a centralized oracle
- Reading from another EVM chain
- MVP User

For more in-depth information about Tellor, check out our [documentation](https://docs.tellor.io/tellor/).


## How to use
### 1. Clone project and install dependencies

```bash
git clone https://github.com/tellor-io/SampleLayerUser.git
```

hardhat:

```bash
cd SampleLayerUser
npm i
```

#### 2. Architecture and Overview

Using tellor layer is simple:
- Have a bridge contract on the chain you want to use (TellorDataBridge).  There should already be a [live bridge](https://docs.tellor.io/layer-docs/using-tellor-data/integrating-tellor-data#contract-addresses) for most users, but if you're working with a new chain, feel free to reach out if you want us to deploy it!
- Request data from the tellor chain ([via a tip](https://docs.tellor.io/layer-docs/running-tellor-layer/command-line-usage/creating-transactions#sending-a-tip-data-request))
- a few seconds later, grab a proof of the verified data from the tellor layer chain.  Can be found here [explorer.tellor.io/oracle-bridge](https://explorer.tellor.io/oracle-bridge)
- submit the data proof to your contract to update your contract with oracle data.

For more advanced users, if you have further questions or if you want to run a reporter yourself, please head to [docs.tellor.io/layer-docs](https://docs.tellor.io/layer-docs)


#### 3. To run tests:

Hardhat: 

```bash
npx hardhat test
```

#### 4. Deployment:
Hardhat: 

First create a .env file corresponding to the .env.example file

Next update your hardhat.config with the correct network/gas settings. 

Then, in scripts/DeploySampleMVPUser.js, change the dataBridgeAddress to correspond to the correct address corresponding to your deployment network [https://docs.tellor.io/tellor/the-basics/contracts-reference](https://docs.tellor.io/tellor/the-basics/contracts-reference). Change the queryId to the correct queryId for the data you want to read. Change the NODE_URL to the correct value for your deployment network.


Next run:
```bash
npx hardhat run scripts/DeploySampleMVPUser.js --network <my_network>

```

### Maintainers <a name="maintainers"> </a>
[@themandalore](https://github.com/themandalore)
<br>
[@brendaloya](https://github.com/brendaloya)


### How to Contribute<a name="how2contribute"> </a>  

Check out our issues log here on Github out in our [Discord](https://discord.gg/teAMSZAfJZ)


### Contributors<a name="contributors"> </a>

This repository is maintained by the Tellor team - [www.tellor.io](https://www.tellor.io)


#### Copyright

Tellor Inc. 2025
