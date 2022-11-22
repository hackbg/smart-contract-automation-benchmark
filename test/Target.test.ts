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
    it("should be true if outside of target window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval + window);
      expect(await target.shouldExec(testNetwork)).to.be.true;
    });

    it("should be false if already executed in the current window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval - 1);
      expect(await target.shouldExec(testNetwork)).to.be.true;

      // executing on the first block of the window
      await target.exec(testNetwork);

      // checking on the next block
      // should be false although inside window
      expect(await target.shouldExec(testNetwork)).to.be.false;

      // checking at the last block of the window
      await mineUpTo(interval + window - 1);
      // should be false although inside window
      expect(await target.shouldExec(testNetwork)).to.be.false;
    });

    it("should allow different networks to execute in the same window", async function () {
      const { target, interval } = await loadFixture(deployTargetFixture);
      const testNetwork2 = formatBytes32String("TEST2");

      await mineUpTo(interval);

      await target.exec(testNetwork);
      expect(await target.shouldExec(testNetwork)).to.be.false;

      expect(await target.shouldExec(testNetwork2)).to.be.true;
    });
  });

  describe("Command", function () {
    describe("During target window", async function () {
      it("should be logged as successful at the start of the window", async function () {
        const { target, interval } = await loadFixture(deployTargetFixture);
        await mineUpTo(interval - 1);

        await expect(target.exec(testNetwork))
          .to.emit(target, "Executed")
          .withArgs(true, 0, testNetwork);
      });

      it("should be logged as successful at the end of the window", async function () {
        const { target, interval, window } = await loadFixture(
          deployTargetFixture
        );
        await mineUpTo(interval + window - 1);

        await expect(target.exec(testNetwork))
          .to.emit(target, "Executed")
          .withArgs(true, window, testNetwork);
      });
    });

    describe("Outside target window", async function () {
      it("should not be logged as successful 1 block before start of the window", async function () {
        const { target, interval } = await loadFixture(deployTargetFixture);

        await mineUpTo(interval - 2);

        await expect(target.exec(testNetwork))
          .to.emit(target, "Executed")
          .withArgs(false, interval - 1, testNetwork);
      });

      it("should not be logged as successful 1 block after end of the window", async function () {
        const { target, interval, window } = await loadFixture(
          deployTargetFixture
        );

        await mineUpTo(interval + window);

        await expect(target.exec(testNetwork))
          .to.emit(target, "Executed")
          .withArgs(false, window + 1, testNetwork);
      });
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with correct network param", async function () {
      const { target, interval } = await loadFixture(deployTargetFixture);

      await mineUpTo(interval);

      await expect(target.performUpkeep(HashZero))
        .to.emit(target, "Executed")
        .withArgs(true, 1, formatBytes32String("CHAINLINK"));
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
