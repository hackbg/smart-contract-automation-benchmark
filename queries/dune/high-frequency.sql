with
  all_rapidfire_execs as (
    select
      (
        datediff(minute, '2022-11-22T00:00:00', evt_block_time) / 10
      ):: int as interval_tx,
      case
        when network = '0x434841494e4c494e4b0000000000000000000000000000000000000000000000' then 'Chainlink'
        when network = '0x47454c41544f0000000000000000000000000000000000000000000000000000' then 'Gelato'
      end as network_name
    from
      {{1. Name of Dune project}}.RapidFire_evt_Executed
    where
      evt_block_number > {{2. First block of test timeframe}}
      and evt_block_number < {{3. Last block of test timeframe}}
    order by
      evt_block_time
  ),
  all_execs_grouped_by_interval as (
    select
      count(network_name) as count_of_txs_per_period,
      network_name
    from
      all_rapidfire_execs
    group by
      interval_tx,
      network_name
  ),
  all_execs_per_network as (
    select
      max(count_of_txs_per_period) as maximum_of_txs_per_period,
      network_name
    from
      all_execs_grouped_by_interval
    group by
      network_name
  )
select
  row_number() over (
    order by
      maximum_of_txs_per_period desc
  ) as `rank`,
  network_name,
  maximum_of_txs_per_period
from
  all_execs_per_network
order by
  maximum_of_txs_per_period desc
