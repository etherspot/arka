--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

-- Create POLICIES Table
CREATE TABLE IF NOT EXISTS sponsorship_policies (
    POLICY_ID INTEGER PRIMARY KEY,
    WALLET_ADDRESS TEXT NOT NULL,
    NAME TEXT NOT NULL,
    DESCRIPTION TEXT,
    START_DATE DATE,
    END_DATE DATE,
    IS_PERPETUAL BOOLEAN DEFAULT FALSE,
    IS_UNIVERSAL BOOLEAN DEFAULT FALSE,
    CONTRACT_RESTRICTIONS TEXT, -- Stores JSON string because SQLite doesn't support JSON natively
    FOREIGN KEY (WALLET_ADDRESS) REFERENCES api_keys(WALLET_ADDRESS)
);

-- Create POLICY_LIMITS Table
CREATE TABLE IF NOT EXISTS sponsorship_policy_limits (
    LIMIT_ID INTEGER PRIMARY KEY,
    POLICY_ID INTEGER NOT NULL,
    LIMIT_TYPE TEXT NOT NULL,
    MAX_USD REAL, -- REAL used in SQLite for floating-point numbers
    MAX_ETH REAL,
    MAX_OPERATIONS INTEGER,
    FOREIGN KEY (POLICY_ID) REFERENCES policies(POLICY_ID)
);

-- Create POLICY_CHAINS Table
CREATE TABLE IF NOT EXISTS sponsorship_policy_chains (
    POLICY_CHAIN_ID INTEGER PRIMARY KEY,
    POLICY_ID INTEGER NOT NULL,
    CHAIN_NAME TEXT NOT NULL,
    FOREIGN KEY (POLICY_ID) REFERENCES policies(POLICY_ID)
);


--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS sponsorship_policy_chains;
DROP TABLE IF EXISTS sponsorship_policy_limits;
DROP TABLE IF EXISTS sponsorship_policies;
