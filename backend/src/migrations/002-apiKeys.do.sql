--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
    API_KEY TEXT NOT NULL PRIMARY KEY,
    WALLET_ADDRESS TEXT NOT NULL UNIQUE,
    PRIVATE_KEY TEXT NOT NULL,
    SUPPORTED_NETWORKS TEXT DEFAULT NULL,
    ERC20_PAYMASTERS TEXT DEFAULT NULL,
    MULTI_TOKEN_PAYMASTERS TEXT DEFAULT NULL,
    MULTI_TOKEN_ORACLES TEXT DEFAULT NULL,
    SPONSOR_NAME TEXT DEFAULT NULL,
    LOGO_URL TEXT DEFAULT NULL,
    TRANSACTION_LIMIT INT NOT NULL,
    NO_OF_TRANSACTIONS_IN_A_MONTH INT,
    INDEXER_ENDPOINT TEXT
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS api_keys;