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

    // Window number of last execution by network
    mapping(bytes32 => uint256) public s_lastWindow;

    /**
     * @notice Captures an execution with details required to compare solutions
     * @param success Indicates whether the execution was within the target window
     * @param latency Elapsed blocks from when a trigger condition is met
     * @param network Name of competitor solution servicing the contract
     */
    event Executed(
        bool indexed success,
        uint256 indexed latency,
        bytes32 indexed network
    );

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
        uint256 latency = block.number % i_interval;
        bool success = latency <= i_window;

        emit Executed(success, latency, network);

        s_lastWindow[network] = getWindow(block.number);
    }

    /**
     * @notice The condition based on which solutions trigger execution
     * @dev Prevents from triggering execution more than once per window
     * @param network Name of competitor solution servicing the contract
     * @return Indicates whether the contract should be serviced
     */
    function shouldExec(bytes32 network) public view returns (bool) {
        uint256 nextBlock = block.number + 1;
        uint256 currentWindow = getWindow(nextBlock);

        return currentWindow != s_lastWindow[network];
    }

    function getWindow(uint256 blockNumber) public view returns (uint256) {
        return blockNumber / i_interval;
    }

    // CHAINLINK AUTOMATION

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        upkeepNeeded = shouldExec("CHAINLINK");
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
        canExec = shouldExec("GELATO");
        execPayload = abi.encodeCall(this.exec, "GELATO");
    }
}
