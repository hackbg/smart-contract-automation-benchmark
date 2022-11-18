// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

/**
 * @notice This is a benchmark contract part of a performance comparison of
 * smart contract automation solutions. It has a target or window of opportunity
 * and tests the ability to execute in timely manner.
 */
contract Target is AutomationCompatible {
    // Interval of blocks between each servicing opportunity
    uint256 public immutable i_interval;

    // Number of blocks defining the window of opportunity
    uint256 public immutable i_window;

    /**
     * @notice Captures an execution with details required to compare solutions
     * @dev Latency is measured by the tx block number in the dashboard query
     * @param success indicates whether the execution was within the target window
     * @param network name of competitor solution servicing the contract
     */
    event Executed(bool indexed success, bytes32 indexed network);

    constructor(uint256 interval, uint256 window) {
        i_interval = interval;
        i_window = window;
    }

    /**
     * @notice Command that needs to be serviced by the competing automation solutions
     * @dev Even if the target has been missed the tx does not revert and always
     * emits an event so it can be easily queried.
     * @param network Name of the solution servicing the contract
     */
    function exec(bytes32 network) public {
        bool success = block.number % i_interval <= i_window;
        emit Executed(success, network);
    }

    /**
     * @notice The condition based on which solutions trigger execution
     * @dev Calculated for the next block as that is earliest chance to execute.
     * @return Indicates whether the contract should be serviced
     */
    function shouldExec() public view returns (bool) {
        uint256 nextBlock = block.number + 1;
        return nextBlock % i_interval <= i_window;
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
