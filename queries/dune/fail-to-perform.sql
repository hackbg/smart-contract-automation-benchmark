with
  all_target_execs as (
    select
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name,
      success
    from
      {{1. Name of Dune project}}.Target_evt_Executed
    where
      evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
  ),
  total_execs_per_network as (
    select
      network_name,
      count(network_name) as total_execs_count
    from
      all_target_execs
    group by
      network_name
  ),
  failed_execs_per_network as (
    select
      network_name,
      count(network_name) as failed_execs_count
    from
      all_target_execs
    where
      success = false
    group by
      network_name
  )
select
  t.network_name,
  t.total_execs_count,
  f.failed_execs_count,
  (f.failed_execs_count / t.total_execs_count) as fail_rate
from
  total_execs_per_network t
  left join failed_execs_per_network f on t.network_name = f.network_name
