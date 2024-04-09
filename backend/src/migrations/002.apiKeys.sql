--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
    API_KEY TEXT NOT NULL PRIMARY KEY,
    WALLET_ADDRESS TEXT NOT NULL,
    PRIVATE_KEY varchar NOT NULL,
    SUPPORTED_NETWORKS varchar DEFAULT NULL,
    ERC20_PAYMASTERS varchar DEFAULT NULL,
    MULTI_TOKEN_PAYMASTERS varchar DEFAULT NULL,
    MULTI_TOKEN_ORACLES varchar DEFAULT NULL,
    TRANSACTION_LIMIT INT NOT NULL,
    NO_OF_TRANSACTIONS_IN_A_MONTH int,
    INDEXER_ENDPOINT varchar
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS api_keys
