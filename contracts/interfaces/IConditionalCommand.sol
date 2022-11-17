// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IConditionalCommand {
    event Executed(bool success, bytes32 indexed network);

    function exec(bytes32 network) external;

    function shouldExec() external view returns (bool);
}
