--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    DEPLOYED_ERC20_PAYMASTERS TEXT NOT NULL,
    PYTH_MAINNET_URL TEXT NOT NULL,
    PYTH_TESTNET_URL TEXT NOT NULL,
    PYTH_TESTNET_CHAIN_IDS TEXT NOT NULL,
    PYTH_MAINNET_CHAIN_IDS TEXT NOT NULL,
    CRON_TIME TEXT NOT NULL,
    CUSTOM_CHAINLINK_DEPLOYED TEXT NOT NULL,
    COINGECKO_IDS TEXT,
    COINGECKO_API_URL TEXT
);

INSERT INTO config (
      DEPLOYED_ERC20_PAYMASTERS,
      PYTH_MAINNET_URL,
      PYTH_TESTNET_URL,
      PYTH_TESTNET_CHAIN_IDS,
      PYTH_MAINNET_CHAIN_IDS,
      CRON_TIME,
      CUSTOM_CHAINLINK_DEPLOYED,
      COINGECKO_IDS,
      COINGECKO_API_URL) VALUES (
      "ewogICAgIjQyMCI6IFsiMHg1M0Y0ODU3OTMwOWY4ZEJmRkU0ZWRFOTIxQzUwMjAwODYxQzI0ODJhIl0sCiAgICAiNDIxNjEzIjogWyIweDBhNkFhMUJkMzBENjk1NGNBNTI1MzE1Mjg3QWRlZUVjYmI2ZUZCNTkiXSwKICAgICI1MDAxIjogWyIweDZFYTI1Y2JiNjAzNjAyNDNFODcxZEQ5MzUyMjVBMjkzYTc4NzA0YTgiXSwKICAgICI4MDAwMSI6IFsiMHhjMzNjMzhBN0JGRUJiQjk5N2RENDAxMUNEZEFmNGViRDFlODgwM0MwIl0KfQ==",
      "https://hermes.pyth.network/api/latest_vaas?ids%5B%5D=",
      "https://hermes-beta.pyth.network/api/latest_vaas?ids%5B%5D=",
      "5001",
      "5000",
      "0 0 * * *",
      "ewogICAgIjgwMDAxIjogWyIweGMzM2MzOEE3QkZFQmJCOTk3ZEQ0MDExQ0RkQWY0ZWJEMWU4ODAzQzAiXQp9",
      "panther",
      "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&precision=8&ids=");

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS config