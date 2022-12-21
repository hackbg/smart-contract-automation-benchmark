# Smart Contract Automation Benchmark

The goal of this project is to do a performance comparison of smart contract automation solutions.

Performance is measured via a statistical comparison of each system’s ability to service smart contracts in various scenarios. These scenarios are captured in the benchmark contracts in this repository.

The solutions included in this benchmark are [Chainlink Automation](https://automation.chain.link) and [Gelato Ops](https://app.gelato.network). The possibility to add new competitors is also part of the overall design and is expected to happen in the future.

The results are reported in a dashboard that objectively shows how the solutions compare in performance in smart contract automation. The dashboard is built using [Dune Analytics](https://dune.com) with the queries included in the repository.

#### Benchmark Contracts

- **[Highlander.sol](/contracts/Highlander.sol)** - This contract is deployed once. It is registered with each of the systems. Each system competes to be the first to service the contract. The contract is designed such that there can be only one winner per servicing opportunity. There is a new servicing opportunity every t seconds. This contract enables us to count which system wins the most opportunities over a period of time (e.g. days, weeks, a rolling period). The only metric for this contract:
  - First to Perform
- **[Target.sol](/contracts/Target.sol)** - This contract is also deployed once and registered with each of the systems. It has a target or window of opportunity (x blocks) every n blocks. Both systems can call it at the same time. Each service execution captures the following performance metrics. Metrics available from this contract include:
  - Latency
  - Fail to Perform
  - User Cost
  - Decentralized nodes
- **[RapidFire.sol](/contracts/RapidFire.sol)** - This contract is nearly identical to the Highlander contract. The only difference is that the trigger condition is always true. It tests how frequently each system can service one contract. There primary metric for this test:
  - High Frequency

#### Metrics

- **[First To Perform](/queries/dune/first-to-perform.sql)** - In a competitive situation, which system is the first to confirm a
  transaction after a common trigger condition has been met.
  - Units: Rank and winning %
- **[Latency](/queries/dune/latency.sql)** - Measure elapsed blocks from when a trigger condition is met and the transaction is confirmed.
  - Units: blocks
- **[Fail to Perform](/queries/dune/fail-to-perform.sql)** - Measure percent of missed opportunities to perform within a reasonable or typical timeframe. This metric is captured during periods of medium and high network congestion.
  - Units: % missed
- **[Decentralized Nodes](/queries/dune/decentralized-nodes.sql)** - Distinct count of nodes that service an upkeep.
  - Units: distinct count of nodes (tx.origin)
- **[User Cost](/queries/dune/user-cost.sql)** - Average price users pay per unit of gas. This is not the price of gas used by the transaction. This is the total transactional cost to the user such as value of tokens debited from their fund.
  - Units: USD per gas unit (or USD per 10k gas)
- **[High Frequency](/queries/dune/high-frequency.sql)** - Measure maximum transaction throughput.
  - Units: Rate (transactions/time)

## Setup

Clone the repo and install all dependencies:

```bash
git clone git@github.com:hackbg/automation-benchmark-contracts.git
cd automation-benchmark-contracts

npm install
```

## Test

Run unit tests on the local Hardhat network:

```bash
npx hardhat test
```

## Deploy

1. To deploy on public networks, copy the `.env.example` to `.env` file.

2. Make sure you've set `PRIVATE_KEY`, a node URL and `ETHERSCAN_API_KEY` to automatically verify the contracts.

3. Run the following to deploy all benchmark contracts:

```bash
npx hardhat run scripts/deploy.ts --network <network>
```

## Run

<details>
  <summary>How to run Highlander benchmark</summary>

1. Register your `Highlander` deployment as Upkeep on [Chainlink Automation](https://automation.chain.link/) with 200K gas limit. It requires minumum of 5 LINK but more may be needed depending on the network, the congestion and the timeframe you want to run this benchmark.

2. Register the same `Highlander` deployment as Task on [Gelato Automation](https://app.gelato.network/).

   2.1 Select `exec` as function to be automated.

   2.2 Use the `Highlander` contract address as resolver and select the `checker` function to be called.

   2.3 Deposit enough native tokens to allow running for the timeframe of the benchmark.

3. Stop the Chainlink Upkeep and Gelato Task once the decided benchmark timeframe has ended.

4. Submit your `Highlander` contract for decoding at [Dune Analytics](https://dune.com/contracts/new).

5. Paste the [First To Perform query](/queries/dune/first-to-perform.sql) into a [new Dune query](https://dune.com/queries).

6. Set all required parameters.

   6.1 `Name of Dune project` is the name you set when submitting the contract for decoding.

   6.2 `First block of test timeframe` must cut the first transaction which is won by the system that is registered first.

   6.3 `Last block of test timeframe` marks the end of the benchmark timeframe.

7. Run the query.

</details>

<details>
  <summary>How to run Target benchmark</summary>

1. Register your `Target` deployment as Upkeep on [Chainlink Automation](https://automation.chain.link/) with 200K gas limit. It requires minumum of 5 LINK but more may be needed depending on the network, the congestion and the timeframe you want to run this benchmark.

2. Register the same `Target` deployment as Task on [Gelato Automation](https://app.gelato.network/).

   2.1 Select `exec` as function to be automated.

   2.2 Use the `Target` contract address as resolver and select the `checker` function to be called.

   2.3 Deposit enough native tokens to allow running for the timeframe of the benchmark.

3. Stop the Chainlink Upkeep and Gelato Task once the decided benchmark timeframe has ended.

4. Submit your `Target` contract for decoding at [Dune Analytics](https://dune.com/contracts/new).

5. Paste the [Latency query](/queries/dune/latency.sql) into a [new Dune query](https://dune.com/queries).

6. Paste the [Fail to Perform query](/queries/dune/fail-to-perform.sql) into a [new Dune query](https://dune.com/queries).

7. Paste the [User Cost query](/queries/dune/user-cost.sql) into a [new Dune query](https://dune.com/queries).

8. Paste the [Decentralized Nodes query](/queries/dune/decentralized-nodes.sql) into a [new Dune query](https://dune.com/queries).

9. Set all required parameters to all queries.

   9.1 `Name of Dune project` is the name you set when submitting the contract for decoding.

   9.2 `First block of test timeframe` must cut the first transaction of each systems because it's difficult to register them altogether and at an exact block number.

   9.3 `Last block of test timeframe` marks the end of the benchmark timeframe.

10. Run the queries.

</details>

<details>
  <summary>How to run RapidFire benchmark</summary>

1. Register your `RapidFire` deployment as Upkeep on [Chainlink Automation](https://automation.chain.link/) with 200K gas limit. It requires minumum of 5 LINK but more may be needed depending on the network, the congestion and the timeframe you want to run this benchmark.

2. Register the same `RapidFire` deployment as Task on [Gelato Automation](https://app.gelato.network/).

   2.1 Select `exec` as function to be automated.

   2.2 Use the `RapidFire` contract address as resolver and select the `checker` function to be called.

   2.3 Deposit enough native tokens to allow running for the timeframe of the benchmark.

3. Stop the Chainlink Upkeep and Gelato Task once the decided benchmark timeframe has ended.

4. Submit your `RapidFire` contract for decoding at [Dune Analytics](https://dune.com/contracts/new).

5. Paste the [High Frequency query](/queries/dune/high-frequency.sql) into a [new Dune query](https://dune.com/queries).

6. Set all required parameters.

   6.1 `Name of Dune project` is the name you set when submitting the contract for decoding.

   6.2 `First block of test timeframe` must cut the first transactions which were submitted before all systems were registered and running.

   6.3 `Last block of test timeframe` marks the end of the benchmark timeframe.

7. Run the query.

</details>

## References

- [Chainlink Automation Docs](https://docs.chain.link/docs/chainlink-automation/introduction)
- [Gelato Ops Docs](https://docs.gelato.network/introduction/what-is-gelato)
