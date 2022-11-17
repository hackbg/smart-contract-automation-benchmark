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
      it("should update last timestamp when interval's passed", async function () {
        const { highlander, interval } = await loadFixture(
          deployHighlanderFixture
        );

        await highlander.exec(testNetwork);
        await time.increase(interval + 1);

        const lastTimestampBeforeExec = await highlander.s_lastTimestamp();
        await highlander.exec(testNetwork);
        const lastTimestampAfterExec = await highlander.s_lastTimestamp();

        expect(lastTimestampBeforeExec).to.be.lt(lastTimestampAfterExec);
      });

      it("should not update last timestamp when interval's not passed", async function () {
        const { highlander } = await loadFixture(deployHighlanderFixture);

        await highlander.exec(testNetwork);

        const lastTimestampBeforeExec = await highlander.s_lastTimestamp();
        await highlander.exec(testNetwork);
        const lastTimestampAfterExec = await highlander.s_lastTimestamp();

        expect(lastTimestampBeforeExec).to.be.eq(lastTimestampAfterExec);
      });
    });

    describe("Events", function () {
      it("should be logged as failed when interval's not passed", async function () {
        const { highlander } = await loadFixture(deployHighlanderFixture);

        await highlander.exec(testNetwork);

        await expect(highlander.exec(testNetwork))
          .to.emit(highlander, "Executed")
          .withArgs(false, testNetwork);
      });

      it("should be logged as successful when interval's passed", async function () {
        const { highlander, interval } = await loadFixture(
          deployHighlanderFixture
        );

        await highlander.exec(testNetwork);

        await time.increase(interval + 1);

        await expect(highlander.exec(testNetwork))
          .to.emit(highlander, "Executed")
          .withArgs(true, testNetwork);
      });
    });
  });

  describe("Chainlink Automation", function () {
    it("should perform upkeep with correct network param", async function () {
      const { highlander } = await loadFixture(deployHighlanderFixture);

      await expect(highlander.performUpkeep(HashZero))
        .to.emit(highlander, "Executed")
        .withArgs(true, formatBytes32String("CHAINLINK"));
    });
  });

  describe("Gelato Ops", function () {
    it("should return exec selector with correct network param", async function () {
      const { highlander } = await loadFixture(deployHighlanderFixture);

      const [, execPayload] = await highlander.checker();

      const execWithGelatoEncoded =
        "0xb5e98b3b47454c41544f0000000000000000000000000000000000000000000000000000";

      expect(execPayload).to.eq(execWithGelatoEncoded);
    });
  });
});
