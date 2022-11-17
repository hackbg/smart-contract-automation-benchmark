// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract RapidFire is AutomationCompatible {
    event Executed(bytes32 indexed network);

    function exec(bytes32 network) public {
        emit Executed(network);
    }

    function shouldExec() public pure returns (bool) {
        return true;
    }

    // CHAINLINK AUTOMATION

    function checkUpkeep(bytes calldata)
        external
        pure
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
