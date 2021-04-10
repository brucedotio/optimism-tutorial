require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('@eth-optimism/plugins/hardhat/compiler')
require('@eth-optimism/plugins/hardhat/ethers')

module.exports = {
  networks: {
    hardhat: {
      accounts: {
        url: 'http://127.0.0.1:9545',
      }
    },
    optimism: {
      url: 'http://127.0.0.1:8545',
      ovm: true // this set the network as using the ovm and ensure contract will be compiled against that.
    }
  },
  solidity: '0.7.6',
  ovm: {
    solcVersion: '0.7.6'
  },
  namedAccounts: {
    deployer: 0
  }
}
