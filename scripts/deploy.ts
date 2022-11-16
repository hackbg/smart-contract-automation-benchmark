import { ethers, network, run } from "hardhat";
import { Contract } from "ethers";

async function verify(contract: Contract, name: string, parameters: any[]) {
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting to verify...");
    await contract.deployTransaction.wait(6);

    console.log(`Verifying ${name}...`);
    await run("verify:verify", {
      address: contract.address,
      contract: `contracts/${name}.sol:${name}`,
      constructorArguments: parameters,
    });
  }
}

async function main() {
  // HIGHLANDER

  const TIME_INTERVAL = 900;

  const Highlander = await ethers.getContractFactory("Highlander");
  const highlander = await Highlander.deploy(TIME_INTERVAL);
  await highlander.deployed();
  console.log(
    `Highlander with ${TIME_INTERVAL}s interval deployed to ${highlander.address}`
  );

  await verify(highlander, "Highlander", [TIME_INTERVAL]);

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

  await verify(target, "Target", [BLOCKS_INTERVAL, WINDOW]);

  // RAPIDFIRE

  const RapidFire = await ethers.getContractFactory("RapidFire");
  const rapidFire = await RapidFire.deploy();
  await rapidFire.deployed();
  console.log(`RapidFire deployed to ${rapidFire.address}`);

  await verify(rapidFire, "Rapidfire", [BLOCKS_INTERVAL, WINDOW]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
