/* External Imports */
const { ethers, network } = require('hardhat')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai
const { JsonRpcProvider } = require('@ethersproject/providers');

chai.use(chaiAsPromised)
chai.use(solidity)

describe(`Test ERC20 on L1 (ethereum)`, () => {
  const INITIAL_SUPPLY = 1000000
  const TOKEN_NAME = 'An ERC20'

  const l1_provider = new JsonRpcProvider('http://localhost:9545')
  //first account
  const l1_key_1 = "0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a"
  const l1_wallet_1 = new ethers.Wallet(l1_key_1)
  const l1_account_1 = l1_wallet_1.connect(l1_provider)
  //second account
  const l1_key_2 = "0xd2ab07f7c10ac88d5f86f1b4c1035d5195e81f27dbe62ad65e59cbf88205629b"
  const l1_wallet_2 = new ethers.Wallet(l1_key_2)
  const l1_account_2 = l1_wallet_2.connect(l1_provider)


  let account1 = l1_account_1
  let account2 = l1_account_2
  before(`load accounts`, async () => {
//    ;[account1, account2] = await ethers.getSigners()
  })

  let ERC20
  beforeEach(`deploy ERC20 contract`, async () => {
    const Factory__ERC20 = await ethers.getContractFactory('ERC20_A')

    ERC20 = await Factory__ERC20.connect(account1).deploy(
      INITIAL_SUPPLY,
      TOKEN_NAME,
    )

    await ERC20.deployTransaction.wait()
  })

  it(`should be deployed to correct chain`, async () => {
    expect(ERC20.deployTransaction.chainId).to.equal(31337)
  })


  it(`should have a name`, async () => {
    const tokenName = await ERC20.name()
    expect(tokenName).to.equal(TOKEN_NAME)
  })

  it(`should have a total supply equal to the initial supply`, async () => {
    const tokenSupply = await ERC20.totalSupply()
    expect(tokenSupply).to.equal(INITIAL_SUPPLY)
  })

  it(`should give the initial supply to the creator's address`, async () => {
    const balance = await ERC20.balanceOf(await account1.getAddress())
    expect(balance).to.equal(INITIAL_SUPPLY)
  })

  describe(`transfer(...)`, () => {
    it(`should revert when the sender does not have enough balance`, async () => {
      const tx = ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY + 1,
        {
          gasLimit: 8999999
        }
      )

      // Temporarily necessary, should be fixed soon.
      if (network.ovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the sender has enough balance`, async () => {
      const tx = await ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })

  describe(`transferFrom(...)`, () => {
    it(`should revert when the sender does not have enough of an allowance`, async () => {
      const tx = ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )

      // Temporarily necessary, should be fixed soon.
      if (network.ovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the owner has enough balance and the sender has a large enough allowance`, async () => {
      const tx1 = await ERC20.connect(account1).approve(
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx1.wait()

      const tx2 = await ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx2.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })
})


describe(`Test ERC20 on L2 (optimism)`, () => {
  const INITIAL_SUPPLY = 1000000
  const TOKEN_NAME = 'An Optimistic ERC20'

  const l2_provider = new JsonRpcProvider('http://localhost:8545')
  const isovm = true

  //first account
  const l1_key_1 = "0x754fde3f5e60ef2c7649061e06957c29017fe21032a8017132c0078e37f6193a"
  const l1_wallet_1 = new ethers.Wallet(l1_key_1)
  const l1_account_1 = l1_wallet_1.connect(l2_provider)
  //second account
  const l1_key_2 = "0xd2ab07f7c10ac88d5f86f1b4c1035d5195e81f27dbe62ad65e59cbf88205629b"
  const l1_wallet_2 = new ethers.Wallet(l1_key_2)
  const l1_account_2 = l1_wallet_2.connect(l2_provider)


  let account1 = l1_account_1
  let account2 = l1_account_2
//  before(`load accounts`, async () => {
//    ;[account1, account2] = await ethers.getSigners()
//  })

  let ERC20
  beforeEach(`deploy ERC20 contract`, async () => {
    const Factory__ERC20 = await l2ethers.getContractFactory('ERC20_A',l2_provider)

    ERC20 = await Factory__ERC20.connect(account1).deploy(
      INITIAL_SUPPLY,
      TOKEN_NAME
    )
    await ERC20.deployTransaction.wait()

  })


  it(`should be deployed to correct chain`, async () => {
    expect(ERC20.deployTransaction.chainId).to.equal(420)
  })


  it(`should have a name`, async () => {

    const tokenName = await ERC20.name()

    expect(tokenName).to.equal(TOKEN_NAME)
  })

  it(`should have a total supply equal to the initial supply`, async () => {
    const tokenSupply = await ERC20.totalSupply()
    expect(tokenSupply).to.equal(INITIAL_SUPPLY)
  })

  it(`should give the initial supply to the creator's address`, async () => {
    const balance = await ERC20.balanceOf(await account1.getAddress())
    expect(balance).to.equal(INITIAL_SUPPLY)
  })

  describe(`transfer(...)`, () => {
    it(`should revert when the sender does not have enough balance`, async () => {
      const tx = ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY + 1,
        {
          gasLimit: 8999999
        }
      )

      // Temporarily necessary, should be fixed soon.
      if (isovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the sender has enough balance`, async () => {
      const tx = await ERC20.connect(account1).transfer(
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })

  describe(`transferFrom(...)`, () => {
    it(`should revert when the sender does not have enough of an allowance`, async () => {
      const tx = ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )

      // Temporarily necessary, should be fixed soon.
      if (isovm) {
        await expect(
          (await tx).wait()
        ).to.be.rejected
      } else {
        await expect(
          tx
        ).to.be.rejected
      }
    })

    it(`should succeed when the owner has enough balance and the sender has a large enough allowance`, async () => {
      const tx1 = await ERC20.connect(account1).approve(
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx1.wait()

      const tx2 = await ERC20.connect(account2).transferFrom(
        await account1.getAddress(),
        await account2.getAddress(),
        INITIAL_SUPPLY,
        {
          gasLimit: 8999999
        }
      )
      await tx2.wait()

      expect(
        (await ERC20.balanceOf(
          await account1.getAddress()
        )).toNumber()
      ).to.equal(0)
      expect(
        (await ERC20.balanceOf(
          await account2.getAddress()
        )).toNumber()
      ).to.equal(INITIAL_SUPPLY)
    })
  })
})
