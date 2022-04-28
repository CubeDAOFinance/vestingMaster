import { expect } from "chai"
import { ethers } from "hardhat"
import { advanceTimeAndBlock, duration } from "./utils/time"
import { getBignumber, getLatestTimestamp } from "./utils/helper"

const DURATION = 60 * 60 * 24 * 7
const TOTAL_PERIODS = 5

describe("MyVestingMaster", function () {
  before(async function () {
    this.signers = await ethers.getSigners()
    this.dev = this.signers[0]
    this.owner = this.signers[1]
    this.masterChef = this.signers[2]

    this.MyVestingMaster = await ethers.getContractFactory("MyVestingMaster")
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.masterChef)
  })

  beforeEach(async function () {
    const period = DURATION
    const lockedPeriodAmount = TOTAL_PERIODS
    this.vestingToken = await this.ERC20Mock.deploy()
    await this.vestingToken.deployed()
    this.myVestingMaster = await this.MyVestingMaster.deploy(period, lockedPeriodAmount, this.vestingToken.address)
    await this.myVestingMaster.deployed()
    await this.myVestingMaster.addLocker(this.masterChef.address)
  })

  it("lock and getVestingAmount", async function () {
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal("0")
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal("0")
    await this.vestingToken.mint(this.myVestingMaster.address, getBignumber(100).toString())
    await this.myVestingMaster.connect(this.masterChef).lock(this.dev.address, getBignumber(100).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber("100").toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal("0")

    await advanceTimeAndBlock(duration.seconds(DURATION).toNumber())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(100).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(20).toString())

    await this.vestingToken.mint(this.myVestingMaster.address, getBignumber(10).toString())
    await this.myVestingMaster.connect(this.masterChef).lock(this.dev.address, getBignumber(10).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(110).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(20).toString())

    await this.vestingToken.mint(this.myVestingMaster.address, getBignumber(40).toString())
    await this.myVestingMaster.connect(this.masterChef).lock(this.dev.address, getBignumber(40).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(150).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(20).toString())

    await advanceTimeAndBlock(duration.seconds(DURATION).toNumber())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(150).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(50).toString())

    await this.vestingToken.mint(this.myVestingMaster.address, getBignumber(30).toString())
    await this.myVestingMaster.connect(this.masterChef).lock(this.dev.address, getBignumber(30).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(180).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(50).toString())

    await advanceTimeAndBlock(duration.seconds(DURATION).toNumber())
    await this.vestingToken.mint(this.myVestingMaster.address, getBignumber(30).toString())
    await this.myVestingMaster.connect(this.masterChef).lock(this.dev.address, getBignumber(30).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(210).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(86).toString())

    await this.myVestingMaster.connect(this.dev).claim()
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(124).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(0).toString())
    expect((await this.vestingToken.balanceOf(this.dev.address)).toString()).to.equal(getBignumber(86).toString())

    await advanceTimeAndBlock(duration.seconds(DURATION).toNumber())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(124).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(42).toString())

    await this.myVestingMaster.connect(this.dev).claim()
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[0]).to.equal(getBignumber(82).toString())
    expect((await this.myVestingMaster.getVestingAmount(this.dev.address))[1]).to.equal(getBignumber(0).toString())
    expect((await this.vestingToken.balanceOf(this.dev.address)).toString()).to.equal(getBignumber(128).toString())
  })
})
