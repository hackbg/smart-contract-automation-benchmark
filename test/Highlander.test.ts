import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const { formatBytes32String } = ethers.utils;
const { HashZero } = ethers.constants;

describe("Highlander", function () {
  const testNetwork = formatBytes32String("TEST");

  async function deployHighlanderFixture() {
    const ONE_HOUR = 60 * 60;

    const interval = ONE_HOUR;

    const [onwer] = await ethers.getSigners();

    const Highlander = await ethers.getContractFactory("Highlander");
    const highlander = await Highlander.deploy(interval);

    return { highlander, interval, onwer };
  }

  describe("Condtion", function () {
    it("should be false before interval's passed", async function () {
      const { highlander } = await loadFixture(deployHighlanderFixture);

      await highlander.exec(testNetwork);

      expect(await highlander.shouldExec()).to.be.false;
    });

    it("should be true after interval's passed", async function () {
      const { highlander, interval } = await loadFixture(
        deployHighlanderFixture
      );

      await highlander.exec(testNetwork);

      await time.increase(interval + 1);

      expect(await highlander.shouldExec()).to.be.true;
    });
  });

  describe("Command", function () {
    describe("Execution", function () {
      it("should fail if interval's not passed", async function () {
        const { highlander } = await loadFixture(deployHighlanderFixture);

        await highlander.exec(testNetwork);

        await expect(
          highlander.exec(testNetwork)
        ).to.be.revertedWithCustomError(highlander, "InvalidExecution");
      });

      it("should not fail if interval's passed", async function () {
        const { highlander, interval } = await loadFixture(
          deployHighlanderFixture
        );

        await highlander.exec(testNetwork);

        await time.increase(interval + 1);

        await expect(highlander.exec(testNetwork)).to.not.be.reverted;
      });
    });

    describe("Events", function () {
      it("should emit when execution succeeds", async function () {
        const { highlander, interval } = await loadFixture(
          deployHighlanderFixture
        );

        await highlander.exec(testNetwork);

        await time.increase(interval + 1);

        await expect(highlander.exec(testNetwork))
          .to.emit(highlander, "Executed")
          .withArgs(testNetwork);
      });

      it("should emit when execution fails", async function () {
        const { highlander } = await loadFixture(deployHighlanderFixture);

        await highlander.exec(testNetwork);

        let failedExecTx;
        try {
          failedExecTx = await highlander.exec(testNetwork);
        } catch (error) {
          expect(failedExecTx)
            .to.emit(highlander, "Executed")
            .withArgs(testNetwork);
        }
      });
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with network name", async function () {
      const { highlander } = await loadFixture(deployHighlanderFixture);

      await expect(highlander.performUpkeep(HashZero))
        .to.emit(highlander, "Executed")
        .withArgs(formatBytes32String("CHAINLINK"));
    });
  });

  describe("Gelato Ops", function () {
    it("should return exec selector with network name arg", async function () {
      const { highlander } = await loadFixture(deployHighlanderFixture);

      const [, execPayload] = await highlander.checker();

      const execWithGelatoEncoded =
        "0xb5e98b3b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000647454c41544f0000000000000000000000000000000000000000000000000000";

      expect(execPayload).to.eq(execWithGelatoEncoded);
    });
  });
});
