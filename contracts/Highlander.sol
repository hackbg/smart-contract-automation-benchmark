// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "./interfaces/IConditionalCommand.sol";

contract Highlander is IConditionalCommand, AutomationCompatible {
    uint256 public immutable i_interval;
    uint256 public s_lastTimestamp;

    constructor(uint256 interval) {
        i_interval = interval;
    }

    function exec(bytes32 network) public {
        emit Executed(network);

        if (!shouldExec()) revert InvalidExecution();

        s_lastTimestamp = block.timestamp;
    }

    function shouldExec() public view returns (bool) {
        return block.timestamp - s_lastTimestamp > i_interval;
    }

    // CHAINLINK AUTOMATION

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        upkeepNeeded = shouldExec();
    }

    function performUpkeep(bytes calldata) external override {
        exec("CHAINLINK");
    }

    // GELATO OPS

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = shouldExec();
        execPayload = abi.encodeCall(IConditionalCommand.exec, "GELATO");
    }
}
