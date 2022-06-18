// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  // test
  //const vestingToken='0xc4D424aaCC8867f9f79FBCa88181E518e33eF178'
  //const masterChef = '0x4b3f5a330A64D3CFAa33ba6E2D2936a195904f38'

  /*/ public test
  const vestingToken='0x1Cc23571EC9DC62B8f80bf5C5e13eA035ce0C49B'
  const masterChef = '0x6273638e3Be5770851E23bfcE27d69592BEDCd2c'
  //*/
  
  /*/ mainnet test
  const vestingToken='0xbFcC24C9465AF1acd57b2C9F6A236332b3665fAb'
  const masterChef = '0x2125fc82ac71b640B7F680F89F0A5ee8D5372D8C'
  //*/

  // mainnet
  const vestingToken='0x6F8A58be5497c82E129B31E1d9B7604ED9b59451'
  const masterChef = '0x441e22e8cC8c3cfa14086a78ED130e1841307860'
  const signer_addr = '0x55f254ee842a890e3f54a8c5f80d63f3e3f2fa8f'
  
  const period = 3600*24*7
  const lockedPeriodAmount = 30
  const MyVestingMaster = await ethers.getContractFactory("MyVestingMaster");
  const myVestingMaster = await MyVestingMaster.deploy(period,lockedPeriodAmount,vestingToken);
  await myVestingMaster.deployed();
  console.log("MyVestingMaster deployed to:", myVestingMaster.address);
  
  // add locker
  const addlocker = await myVestingMaster.addLocker(masterChef);
  await addlocker.wait();
  
  //const MyVestingMaster = await ethers.getContractFactory("MyVestingMaster");
  //const myVestingMaster = MyVestingMaster.attach('');
  const newlocker = await myVestingMaster.getLocker((await myVestingMaster.getLockersCount()).toNumber()-1);
  console.log("new locker",newlocker);

  const setOwner = await myVestingMaster.transferOwnership(signer_addr);
  await setOwner.wait();
  const vestingOwner = await myVestingMaster.owner();
  console.log("set myVestingMaster Owner",vestingOwner);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
