import {
  mineUpTo,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const { formatBytes32String } = ethers.utils;
const { HashZero } = ethers.constants;

describe("Target", function () {
  const testNetwork = formatBytes32String("TEST");

  async function deployTargetFixture() {
    const interval = 100;
    const window = 5;

    const [onwer] = await ethers.getSigners();

    const Target = await ethers.getContractFactory("Target");
    const target = await Target.deploy(interval, window);

    return { target, interval, window, onwer };
  }

  describe("Condition", function () {
    it("should be false outside of target window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval - window);

      expect(await target.shouldExec()).to.be.false;
    });

    it("should be true a block prior window openning", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval - 1);
      expect(await target.shouldExec()).to.be.true;
    });

    it("should be true a block prior closing window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval + window - 1);
      expect(await target.shouldExec()).to.be.true;
    });
  });

  describe("Command", function () {
    it("should be logged as failed outside of target window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval - window);

      await expect(target.exec(testNetwork))
        .to.emit(target, "Executed")
        .withArgs(false, testNetwork);
    });

    it("should be logged as successful throughout target window", async function () {
      const { target, interval } = await loadFixture(deployTargetFixture);

      await mineUpTo(interval);

      await expect(target.exec(testNetwork))
        .to.emit(target, "Executed")
        .withArgs(true, testNetwork);
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with correct network param", async function () {
      const { target, interval } = await loadFixture(deployTargetFixture);

      await mineUpTo(interval);

      await expect(target.performUpkeep(HashZero))
        .to.emit(target, "Executed")
        .withArgs(true, formatBytes32String("CHAINLINK"));
    });
  });

  describe("Gelato Ops", function () {
    it("should return exec selector with correct network param", async function () {
      const { target } = await loadFixture(deployTargetFixture);

      const [, execPayload] = await target.checker();

      const execWithGelatoEncoded =
        "0xb5e98b3b47454c41544f0000000000000000000000000000000000000000000000000000";

      expect(execPayload).to.eq(execWithGelatoEncoded);
    });
  });
});
