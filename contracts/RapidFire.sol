// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

/**
 * @notice This is a benchmark contract part of a performance comparison of
 * smart contract automation solutions. It tests how frequently each competitor
 * system can service one contract.
 */
contract RapidFire is AutomationCompatible {
    /**
     * @notice Captures an execution with details required to compare solutions
     * @param network name of competitor solution servicing the contract
     */
    event Executed(bytes32 indexed network);

    /**
     * @notice Command that needs to be serviced by the competing automation solutions
     * @param network Name of the solution servicing the contract
     */
    function exec(bytes32 network) public {
        emit Executed(network);
    }

    /**
     * @notice The condition based on which solutions trigger execution
     * @return Indicates whether the contract should be serviced
     */
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
