// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

/**
 * @notice This is a benchmark contract part of a performance comparison of
 * smart contract automation solutions. It is desigend such that there can be only
 * one winner per servicing opportunity. There is a new servicing opportunity
 * every t seconds.
 */
contract Highlander is AutomationCompatible {
    // Interval of seconds between servicing opportunities
    uint256 public immutable i_interval;

    // Last execution time
    uint256 public s_lastTimestamp;

    /**
     * @notice Captures an execution with details required to compare solutions
     * @param success indicates whether the execution was within the target window
     * @param network name of competitor solution servicing the contract
     */
    event Executed(bool indexed success, bytes32 indexed network);

    constructor(uint256 interval) {
        i_interval = interval;
    }

    /**
     * @notice Command that needs to be serviced by the competing automation solutions
     * @dev Even if the servicing opportunity has been  missed the tx does not revert and
     * always emits an event so it can be easily queried.
     * @param network Name of the solution servicing the contract
     */
    function exec(bytes32 network) public {
        bool success = shouldExec();

        emit Executed(success, network);

        if (success) {
            s_lastTimestamp = block.timestamp;
        }
    }

    /**
     * @notice The condition based on which solutions trigger execution
     * @return Indicates whether the contract should be serviced
     */
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
