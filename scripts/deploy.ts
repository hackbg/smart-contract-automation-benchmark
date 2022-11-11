import { ethers } from "hardhat";

async function main() {
  // HIGHLANDER

  const TIME_INTERVAL = 900;

  const Highlander = await ethers.getContractFactory("Highlander");
  const highlander = await Highlander.deploy(TIME_INTERVAL);
  await highlander.deployed();
  console.log(
    `Highlander with ${TIME_INTERVAL}s interval deployed to ${highlander.address}`
  );

  // TARGET

  const BLOCKS_INTERVAL = 100;
  const WINDOW = 5;

  const Target = await ethers.getContractFactory("Target");
  const target = await Target.deploy(BLOCKS_INTERVAL, WINDOW);
  await target.deployed();
  console.log(
    `Target with ${BLOCKS_INTERVAL} blocks interval and ${WINDOW} ` +
      `blocks window deployed to ${target.address}`
  );

  // RAPIDFIRE

  const RapidFire = await ethers.getContractFactory("RapidFire");
  const rapidFire = await RapidFire.deploy();
  await rapidFire.deployed();
  console.log(`RapidFire deployed to ${rapidFire.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
