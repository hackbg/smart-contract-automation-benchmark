with
  all_target_execs as (
    select
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name,
      evt_block_number,
      evt_block_time,
      evt_tx_hash
    from
      {{1. Name of Dune project}}.Target_evt_Executed
    where
      evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
  ),
  link_price_table as (
    SELECT
      minute,
      price as link_in_usd
    FROM
      prices.usd
    where
      contract_address = '0x514910771af9ca656af840dff83e8264ecf986ca' -- link token address
  ),
  matic_price_table as (
    select
      minute,
      price as matic_in_usd
    from
      prices.usd
    where
      symbol = "MATIC"
      and blockchain = 'polygon'
      and minute > '2022-11-24 00:00'
  ),
  all_gelato_target_execs as (
    select
      network_name,
      evt_block_number,
      evt_block_time,
      evt_tx_hash
    from
      all_target_execs
    where
      network_name = 'Gelato'
  ),
  all_gelato_target_execs_fees as (
    select
      network_name,
      t.evt_block_number,
      t.evt_block_time,
      t.evt_tx_hash,
      fees,
      date_trunc ('minute', t.evt_block_time) as tx_minute
    from
      gelato_polygon.TaskTreasuryUpgradable_evt_LogDeductFees as t
      inner join all_gelato_target_execs e on e.evt_tx_hash = t.evt_tx_hash
  ),
  all_gelato_target_execs_fees_in_usd as (
    select
      network_name,
      evt_block_time,
      evt_tx_hash,
      evt_block_number,
      fees / 1e18 * matic_in_usd as fees_paid_in_usd
    from
      all_gelato_target_execs_fees f
      inner join matic_price_table m on f.tx_minute = m.`minute`
  ),
  all_chainlink_target_execs as (
    select
      network_name,
      evt_tx_hash,
      evt_block_time,
      evt_block_number,
      date_trunc ('minute', evt_block_time) as exec_minute
    from
      all_target_execs
    where
      network_name = 'Chainlink'
  ),
  all_chainlink_target_execs_fees as (
    select
      e.network_name,
      e.evt_tx_hash,
      e.evt_block_time,
      e.evt_block_number,
      e.exec_minute,
      k.payment / 1e18 as fee_paid_in_link
    from
      all_chainlink_target_execs e
      left join chainlink_polygon.KeeperRegistry_evt_UpkeepPerformed k on e.evt_tx_hash = k.evt_tx_hash
    where
      e.network_name = 'Chainlink'
  ),
  all_chainlink_target_execs_fees_in_usd as (
    select
      evt_block_number,
      evt_tx_hash,
      evt_block_time,
      network_name,
      fee_paid_in_link * link_in_usd as fee_paid_in_usd
    from
      all_chainlink_target_execs_fees a
      inner join link_price_table p on a.exec_minute = p.minute
  ),
  chainlink_user_cost as (
    select
      'Chainlink' as network,
      sum(c.fee_paid_in_usd) / (sum(p.gas_used) / 1e4) as usd_per_10k_gas
    from
      polygon.transactions p
      inner join all_chainlink_target_execs_fees_in_usd c on c.evt_block_number = p.block_number
      and c.evt_block_time = p.block_time
      and c.evt_tx_hash = p.hash
    where
      network_name = 'Chainlink'
  ),
  gelato_user_cost as (
    select
      'Gelato' as network,
      sum(g.fees_paid_in_usd) / (sum(p.gas_used) / 1e4) as usd_per_10k_gas
    from
      polygon.transactions p
      inner join all_gelato_target_execs_fees_in_usd g on p.block_number = g.evt_block_number
      and p.block_time = g.evt_block_time
      and p.hash = g.evt_tx_hash
    where
      network_name = 'Gelato'
  )
select
  network,
  usd_per_10k_gas
from
  gelato_user_cost
union all
select
  network,
  usd_per_10k_gas
from
  chainlink_user_cost
