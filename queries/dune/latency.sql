with
  all_target_execs as (
    select
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name,
      latency:: int
    from
      {{1. Name of Dune project}}.Target_evt_Executed
    where
      evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
  )

select
  network_name,
  latency,
  count(latency) as execs_count
from
  all_target_execs
group by
  network_name,
  latency
order by
  network_name,
  latency
