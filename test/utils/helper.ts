import { BigNumber, BigNumberish } from "ethers"
import { ethers } from "hardhat"

export function getBignumber(amount: BigNumberish, decimals = 18): BigNumber {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

export async function getLatestTimestamp() {
  const blockNumber = await ethers.provider.getBlockNumber()
  const block = await ethers.provider.getBlock(blockNumber)
  return block.timestamp
}
