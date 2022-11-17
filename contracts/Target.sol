// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "./interfaces/IConditionalCommand.sol";

contract Target is IConditionalCommand, AutomationCompatible {
    uint256 public immutable i_interval;
    uint256 public immutable i_window;

    constructor(uint256 interval, uint256 window) {
        i_interval = interval;
        i_window = window;
    }

    function exec(bytes32 network) public {
        bool success = shouldExec();
        emit Executed(success, network);
    }

    function shouldExec() public view returns (bool) {
        return block.number % i_interval <= i_window;
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
        execPayload = abi.encodeWithSelector(this.exec.selector, "GELATO");
    }
}
