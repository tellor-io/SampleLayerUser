
## Sample Projects using Layer <a name="sample"> </a>

<b>The Tellor oracle</b> is a decentralized oracle. The tellor oracle chain, layer, provides an option for contracts to interact securely with and obtain data from off-chain.

This repository aims to provide an updated version of various examples of sample code that uses Tellor.  Note that there are different checks and best practices dependng on the specific use case and user profile.  The examples specified in this repo are: 

    * Price feeds
    * Slow data (e.g. the CPI thats updated monthly)
    * Prediction Markets
    * Tellor as a fallback to a centralized oracle
    * Bridging data

For more in-depth information about Tellor, check out our [documentation](https://docs.tellor.io/tellor/).

Quick references are included below:

# Implement Tellor into your project
This repo already includes the [usingTellor](https://github.com/tellor-io/usingtellor) package.

## How to use
#### 1. Clone project and install dependencies

```bash
git clone git@github.com:tellor-io/sampleUsingTellor.git
```

hardhat:

```bash
cd hardhat
npm i
```

#### 2. How to Use

Using tellor layer is simple:
    - Have a bridge contract on the chain you want to us (blobstreamO).  This should be done for most users, but if you're working with a new chain, feel free to reach out if you want us to deploy it!

    - Request data from the tellor chain (via a tip)
    - a few seconds later, grab a proof of the verified datafrom the tellor layer chain.  Can be found here(https://feed.tellor.io/)
    - submit the proof data to your contract to update your contract with oracle data.  

    For more advanced users, if you have further questions or if you want to run a reporter yourself, please head to [docs.tellor.io](docs.tellor.io)



#### 5. To run tests:

Hardhat: 

```bash
npx hardhat test
```

#### 6. Deployment:
Hardhat: 

First create a .env file corresponding to the .env.example file

Next update your hardhat.config with the correct network/gas settings. 

Then, in ignition/modules/SampleUsingTellor.js, change the tellor address to correspond to the correct address corresponding to your deployment network [https://docs.tellor.io/tellor/the-basics/contracts-reference](https://docs.tellor.io/tellor/the-basics/contracts-reference)


Next run:
```bash
npx hardhat ignition deploy ignition/modules/SampleUsingTellor.js --network <my_network>

```

#### Maintainers <a name="maintainers"> </a>
[@themandalore](https://github.com/themandalore)
<br>
[@brendaloya](https://github.com/brendaloya)


#### How to Contribute<a name="how2contribute"> </a>  

Check out our issues log here on Github out in our [Discord](https://discord.gg/teAMSZAfJZ)


#### Contributors<a name="contributors"> </a>

This repository is maintained by the Tellor team - [www.tellor.io](https://www.tellor.io)


#### Copyright

Tellor Inc. 2024
