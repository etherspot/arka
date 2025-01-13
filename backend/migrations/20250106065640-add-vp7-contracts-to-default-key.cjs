require('dotenv').config();

const vp7Contracts = JSON.stringify({
    31: "0x805650ce74561C85baA44a8Bd13E19633Fd0F79d",
    50: "0xABA00E929d66119A4A7F4B2E27150fC387ee801c",
    51: "0x2b7cBFA523E0D0546C6d1F706b79dB7B6d910bdA",
    97: "0xD9A97785a91086FDeF17980eDC2f9D290d71153F",
    114: "0x5952653F151e844346825050d7157A9a6b46A23A",
    123: "0xf6E4486156cc2F982eceC15a90B23047F396EcBE",
    5003: "0x42963C58DE382D34CB5a7f77b703e645FcE6DD26",
    80002: "0x9ddB9DC20E904206823184577e9C571c713d2c57",
    84532: "0xD9A97785a91086FDeF17980eDC2f9D290d71153F",
    421614: "0x5FD81CfCAa69F44B6d105795961b3E484ac9e7dB",
    534351: "0xD9A97785a91086FDeF17980eDC2f9D290d71153F",
    11155111: "0x8B57f6b24C7cd85007068Bf0587382804B225DB6",
    11155420: "0x51a62e2B1E295CAe7Db5b91886735f9Ce335AcFB",
    28122024: "0xc95A2Fb019445C9B3459c2C59e7cd6Ad2c8FBb1E"
});

async function up({ context: queryInterface }) {
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."api_keys" SET "VERIFYING_PAYMASTERS_V2"='${vp7Contracts}' WHERE "API_KEY"='arka_public_key'`
    );
}

async function down({ context: queryInterface }) {
    await queryInterface.sequelize.query(
        `UPDATE ${process.env.DATABASE_SCHEMA_NAME}."api_keys" SET "VERIFYING_PAYMASTERS_V2"=${null} WHERE "API_KEYS"='arka_public_key'`
    );
}

module.exports = {up, down};
