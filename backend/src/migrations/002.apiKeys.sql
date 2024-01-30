--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
    API_KEY TEXT NOT NULL PRIMARY KEY,
    WALLET_ADDRESS TEXT NOT NULL,
    PRIVATE_KEY varchar NOT NULL,
    SUPPORTED_NETWORKS varchar DEFAULT NULL,
    ERC20_PAYMASTERS varchar DEFAULT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS api_keys