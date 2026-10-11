const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:i@m@PG@fazahdbserver.postgres.database.azure.com:5432/garageclock'
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully!');
    return client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
