with
  all_target_execs as (
    select
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name,
      evt_tx_hash,
      evt_block_time,
      evt_block_number
    from
      {{1. Name of Dune project}}.Target_evt_Executed
    where
      evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
  )
select
  e.network_name,
  count(distinct t.from) as distinct_node_count,
  count(network_name) as all_network_execs
from
  all_target_execs e
  left join polygon.transactions t on e.evt_block_number = t.block_number
  and e.evt_block_time = t.block_time
  and e.evt_tx_hash = t.hash
group by
  e.network_name
