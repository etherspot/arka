--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

-- Create sponsorship_policies Table
CREATE TABLE IF NOT EXISTS sponsorship_policies (
    ID SERIAL PRIMARY KEY,
    WALLET_ADDRESS TEXT NOT NULL UNIQUE,
    NAME TEXT NOT NULL,
    DESCRIPTION TEXT,
    START_DATE DATE,
    END_DATE DATE,
    IS_PERPETUAL BOOLEAN DEFAULT FALSE,
    IS_UNIVERSAL BOOLEAN DEFAULT FALSE,
    CONTRACT_RESTRICTIONS TEXT, -- Stores JSON string because PostgreSQL supports JSON natively
    FOREIGN KEY (WALLET_ADDRESS) REFERENCES api_keys(WALLET_ADDRESS) ON DELETE CASCADE
);

-- Create sponsorship_policy_limits Table
CREATE TABLE IF NOT EXISTS sponsorship_policy_limits (
    POLICY_ID INT NOT NULL,
    LIMIT_TYPE TEXT NOT NULL,
    MAX_USD FLOAT, -- FLOAT used in PostgreSQL for floating-point numbers
    MAX_ETH FLOAT,
    MAX_OPERATIONS INT,
    FOREIGN KEY (POLICY_ID) REFERENCES sponsorship_policies(ID) ON DELETE CASCADE,
    PRIMARY KEY (POLICY_ID, LIMIT_TYPE) -- Composite primary key
);

-- Create sponsorship_policy_chains Table
CREATE TABLE IF NOT EXISTS sponsorship_policy_chains (
    POLICY_ID INT NOT NULL,
    CHAIN_ID TEXT NOT NULL,
    FOREIGN KEY (POLICY_ID) REFERENCES sponsorship_policies(ID) ON DELETE CASCADE,
    PRIMARY KEY (POLICY_ID, CHAIN_ID) -- Composite primary key
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS sponsorship_policy_chains;
DROP TABLE IF EXISTS sponsorship_policy_limits;
DROP TABLE IF EXISTS sponsorship_policies;