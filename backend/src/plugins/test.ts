
import { Sequelize, QueryTypes } from 'sequelize';

// npx ts-node backend/src/plugins/test.ts
async function runQuery() {
    // Replace with your actual connection string
    const sequelize = new Sequelize('postgresql://arkauser:paymaster@localhost:5432/arkadev', {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            searchPath: 'arka',
        },
    });

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Replace with your actual SQL query
        const result = await sequelize.query('SELECT * FROM arka.config', { type: QueryTypes.SELECT });
        console.log(result);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

runQuery();