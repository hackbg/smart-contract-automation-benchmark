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

    it("should be true throughout target window", async function () {
      const { target, interval, window } = await loadFixture(
        deployTargetFixture
      );

      await mineUpTo(interval);
      expect(await target.shouldExec()).to.be.true;

      await mineUpTo(interval + window);
      expect(await target.shouldExec()).to.be.true;
    });
  });

  describe("Command", function () {
    describe("Execution", function () {
      it("should fail if outside of target window", async function () {
        const { target, interval, window } = await loadFixture(
          deployTargetFixture
        );

        await mineUpTo(interval - window);

        await expect(target.exec(testNetwork)).to.be.revertedWithCustomError(
          target,
          "InvalidExecution"
        );
      });

      it("should not fail when throughout target window", async function () {
        const { target, interval } = await loadFixture(deployTargetFixture);

        await mineUpTo(interval);

        await expect(target.exec(testNetwork)).to.not.be.reverted;
      });
    });

    describe("Events", function () {
      it("should emit when execution succeeds", async function () {
        const { target, interval } = await loadFixture(deployTargetFixture);

        await mineUpTo(interval);

        await expect(target.exec(testNetwork))
          .to.emit(target, "Executed")
          .withArgs(testNetwork);
      });

      it("should emit when execution fails", async function () {
        const { target } = await loadFixture(deployTargetFixture);

        let failedExecTx;
        try {
          failedExecTx = await target.exec(testNetwork);
        } catch (exception) {
          expect(failedExecTx)
            .to.emit(target, "Executed")
            .withArgs(testNetwork);
        }
      });
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with network name", async function () {
      const { target } = await loadFixture(deployTargetFixture);

      await expect(target.performUpkeep(HashZero))
        .to.emit(target, "Executed")
        .withArgs(formatBytes32String("CHAINLINK"));
    });
  });

  describe("Gelato Ops", function () {
    it("should return exec selector with network name arg", async function () {
      const { target } = await loadFixture(deployTargetFixture);

      const [, execPayload] = await target.checker();

      const execWithGelatoEncoded =
        "0xb5e98b3b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000647454c41544f0000000000000000000000000000000000000000000000000000";

      expect(execPayload).to.eq(execWithGelatoEncoded);
    });
  });
});
