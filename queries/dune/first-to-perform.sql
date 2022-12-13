with
  all_successful_highlander_execs as (
    SELECT
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name
    FROM
      {{1. Name of Dune project}}.Highlander_evt_Executed
    where
      success = true
      and evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
  )
select
  row_number() over (
    order by
      count(network_name) desc
  ) as `rank`,
  network_name,
  count(network_name) as successful_executions,
  count(network_name) / (
    select
      count(*)
    from
      all_successful_highlander_execs
  ) * 100 as percentage_of_total_execuutions
from
  all_successful_highlander_execs
group by
  network_name
order by
  successful_executions desc
