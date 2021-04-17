/* External Imports */
const { ethers, l2ethers } = require('hardhat')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Watcher } = require('@eth-optimism/watcher')
const { getContractInterface } = require('@eth-optimism/contracts')
//be as lazy as possible!
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
chai.use(chaiAsPromised)
chai.use(solidity)


describe(`Test send/rec msgs from/to L1/L2 `, () => {
  //Token configuration
  const INITIAL_SUPPLY = 10000000
  const TOKEN_NAME = 'L1/L2 Deployed Optimistic ERC20'
  //Optimism Constants
  const L1_MESSENGER_ADDRESS = '0x6418E5Da52A3d7543d393ADD3Fa98B0795d27736'
  //const L1_MESSENGER_ADDRESS = '0x5bD12f0B56C8973ac98446435E07Df8311Aa362c'
  //0x59b670e9fA9D0A427751Af201D676719a970857b
  const L2_MESSENGER_ADDRESS = '0x4200000000000000000000000000000000000007'
  const ADDRESSMANAGER_ADDRESS = '0x3e4CFaa8730092552d9425575E49bB542e329981'

  //L1 contracts
  let ADDRESS_MANAGER_L1

  let L1_SIMPLESTORAGE
  let L2_SIMPLESTORAGE
  //providers
  const l1_provider = new JsonRpcProvider('http://localhost:9545')
  const l2_provider = new JsonRpcProvider('http://localhost:8545')

  //ACCOUNT
  //first account L1
  const l1_key = "0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a"
  const l1_wallet_1 = new ethers.Wallet(l1_key)
  const l1_account_1 = l1_wallet_1.connect(l1_provider)

  //first account L2
  const l2_key = "0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a"
  const l2_wallet_1 = new ethers.Wallet(l2_key)
  const l2_account_1 = l2_wallet_1.connect(l2_provider)

  //second account L2
  const l2_key_2 = "0xd2ab07f7c10ac88d5f86f1b4c1035d5195e81f27dbe62ad65e59cbf88205629b"
  const l2_wallet_2 = new ethers.Wallet(l2_key_2)
  const l2_account_2 = l2_wallet_2.connect(l2_provider)


  let L1CrossDomainMessenger
  let L2CrossDomainMessenger

  let ADDRESS_MANAGER_GLOBAL

  let watcher

  before(`deploy and init ERC20 L1 + L2 contracts`, async () => {

    //create factory for ERC20 contract on L1 with l1_account_1 account
    try {
      /*
      const addressManagerInterface = getContractInterface('Lib_AddressManager')

      ADDRESS_MANAGER_L1 = new ethers.Contract(
        ADDRESSMANAGER_ADDRESS,
        addressManagerInterface,
        l1_provider
      )
      ADDRESS_MANAGER_GLOBAL = ADDRESS_MANAGER_L1
      */
    //  const addressManagerInterface = getContractInterface('iOVM_L1CrossDomainMessenger')
    //  const addressManagerInterface = getContractInterface('iOVM_L2CrossDomainMessenger')

      L1CrossDomainMessenger = new ethers.Contract(
        L1_MESSENGER_ADDRESS,
        await getContractInterface('iOVM_L1CrossDomainMessenger'),
        l1_account_1
      )

      L2CrossDomainMessenger = new ethers.Contract(
        L2_MESSENGER_ADDRESS,
        await getContractInterface('iOVM_L2CrossDomainMessenger'),
        l2_account_1
      )

      const Factory__L1SimpleStorage = await ethers.getContractFactory('SimpleStorage')
      const Factory__L2SimpleStorage = await l2ethers.getContractFactory('SimpleStorage')

      L1_SIMPLESTORAGE = await Factory__L1SimpleStorage.connect(l1_account_1).deploy()
      L2_SIMPLESTORAGE = await Factory__L2SimpleStorage.connect(l2_account_1).deploy()

    }
    catch (e)
   {
     console.log(e)
   }

   //todo
   watcher = new Watcher({
       l1: {
         provider: l1_provider,
         messengerAddress: L1_MESSENGER_ADDRESS
       },
       l2: {
         provider: l2_provider,
         messengerAddress: L2_MESSENGER_ADDRESS
       }
     })

  })


  describe(`Testing send message across L1/L2`, async () => {

    it(`should be deployed to correct chains`, async () => {
      /*
      console.log(L2CrossDomainMessenger.address)
      console.log(L1CrossDomainMessenger.address)
      console.log(L1_SIMPLESTORAGE.address)
      console.log(L2_SIMPLESTORAGE.address)
      */
      expect(L1_SIMPLESTORAGE.deployTransaction.chainId).to.equal(31337)
      expect(L2_SIMPLESTORAGE.deployTransaction.chainId).to.equal(420)
    })

    it('should send msg L1 --> L2', async () => {
       const value = `0x${'42'.repeat(32)}`

       // Send L1 -> L2 message.
       const transaction = await L1CrossDomainMessenger.sendMessage(
         L2_SIMPLESTORAGE.address,
         L2_SIMPLESTORAGE.interface.encodeFunctionData('setValue', [value]),
         5000000,
         { gasLimit: 7000000 }
       )

       // Wait for the L1 transaction to be mined.
       let txrec = await transaction.wait()

       // Wait for the transaction to be included on L2.
       const messageHashes = await watcher.getMessageHashesFromL1Tx(transaction.hash)
       expect(messageHashes.length).to.equal(1)

       let l2txrec = await watcher.getL2TransactionReceipt(messageHashes[0])
       expect(await L2_SIMPLESTORAGE.msgSender()).to.equal(L2CrossDomainMessenger.address)
       expect(await L2_SIMPLESTORAGE.xDomainSender()).to.equal(l1_account_1.address)
       expect(await L2_SIMPLESTORAGE.value()).to.equal(value)
       expect((await L2_SIMPLESTORAGE.totalCount()).toNumber()).to.equal(1)
     })


   it(`should send msg L2 --> l1 [needs work]`, async () => {
     //todo: sometimes message relayer container crashes
     //and this starts failing, tbd
     //you can simply start the container and it should start working again
     //sometimes container will still be up and fail
     //full restart of optimism-integration containers is needed in that case

      const value = `0x${'77'.repeat(32)}`

      // Send L2 -> L1 message.
      const transaction = await L2CrossDomainMessenger.sendMessage(
        L1_SIMPLESTORAGE.address,
        L1_SIMPLESTORAGE.interface.encodeFunctionData('setValue', [value]),
        5000000,
        { gasLimit: 7000000 }
      )

      // Wait for the L2 transaction to be mined.
      let txrec = await transaction.wait()

      // Wait for the transaction to be relayed on L1.
      const messageHashes = await watcher.getMessageHashesFromL2Tx(transaction.hash)
      expect(messageHashes.length).to.equal(1)

      let l1txrec = await watcher.getL1TransactionReceipt(messageHashes[0])
      expect(await L1_SIMPLESTORAGE.msgSender()).to.equal(L1CrossDomainMessenger.address)
      expect(await L1_SIMPLESTORAGE.xDomainSender()).to.equal(l2_account_1.address)
      expect(await L1_SIMPLESTORAGE.value()).to.equal(value)
      expect((await L1_SIMPLESTORAGE.totalCount()).toNumber()).to.equal(1)

    })

  })

})
