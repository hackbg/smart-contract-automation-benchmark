import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const { formatBytes32String } = ethers.utils;
const { HashZero } = ethers.constants;

describe("RapidFire", function () {
  const testNetwork = formatBytes32String("TEST");

  async function deployRapidFireFixture() {
    const [onwer] = await ethers.getSigners();

    const RapidFire = await ethers.getContractFactory("RapidFire");
    const rapidFire = await RapidFire.deploy();

    return { rapidFire, onwer };
  }

  describe("Condition", function () {
    it("should be true", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      expect(await rapidFire.shouldExec()).to.be.true;
    });
  });

  describe("Command", function () {
    it("should always execute", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      await expect(rapidFire.exec(testNetwork))
        .to.emit(rapidFire, "Executed")
        .withArgs(true, testNetwork);

      await expect(rapidFire.exec(testNetwork))
        .to.emit(rapidFire, "Executed")
        .withArgs(true, testNetwork);
    });

    it("should emit event on execution", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      await expect(rapidFire.exec(testNetwork))
        .to.emit(rapidFire, "Executed")
        .withArgs(true, testNetwork);
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with network name", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      await expect(rapidFire.performUpkeep(HashZero))
        .to.emit(rapidFire, "Executed")
        .withArgs(true, formatBytes32String("CHAINLINK"));
    });
  });

  describe("Gelato Ops", function () {
    it("should be true when checking if task should be executed", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      const [canExec] = await rapidFire.checker();

      expect(canExec).to.be.true;
    });

    it("should return exec selector with network name arg", async function () {
      const { rapidFire } = await loadFixture(deployRapidFireFixture);

      const [, execPayload] = await rapidFire.checker();

      const execWithGelatoEncoded =
        "0xb5e98b3b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000647454c41544f0000000000000000000000000000000000000000000000000000";

      expect(execPayload).to.eq(execWithGelatoEncoded);
    });
  });
});
