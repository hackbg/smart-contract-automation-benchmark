// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract Highlander is AutomationCompatible {
    uint256 public immutable i_interval;
    uint256 public s_lastTimestamp;

    event Executed(bool indexed success, bytes32 indexed network);

    constructor(uint256 interval) {
        i_interval = interval;
    }

    function exec(bytes32 network) public {
        bool success = shouldExec();

        emit Executed(success, network);

        if (success) {
            s_lastTimestamp = block.timestamp;
        }
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
        execPayload = abi.encodeCall(this.exec, "GELATO");
    }
}
