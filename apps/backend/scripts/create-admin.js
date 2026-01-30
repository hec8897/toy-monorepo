require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !['create', 'upgrade'].includes(command)) {
    console.log('Usage:');
    console.log(
      '  node create-admin.js create <username> <password>  - Create new admin',
    );
    console.log(
      '  node create-admin.js upgrade <username>            - Upgrade existing user to admin',
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    if (command === 'create') {
      const username = args[1];
      const password = args[2];

      if (!username || !password) {
        console.error('Error: username and password required');
        console.log('Usage: node create-admin.js create <username> <password>');
        process.exit(1);
      }

      // Check if user exists
      const checkResult = await client.query(
        'SELECT id FROM members WHERE username = $1',
        [username],
      );

      if (checkResult.rows.length > 0) {
        console.error(
          `Error: User '${username}' already exists. Use 'upgrade' command instead.`,
        );
        process.exit(1);
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await client.query(
        `INSERT INTO members (username, name, password, phone, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, name, role`,
        [
          username,
          `Admin ${username}`,
          hashedPassword,
          '000-0000-0000',
          'admin',
        ],
      );

      console.log('Admin created:', result.rows[0]);
      console.log('\nLogin credentials:');
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
    } else if (command === 'upgrade') {
      const username = args[1];

      if (!username) {
        console.error('Error: username required');
        console.log('Usage: node create-admin.js upgrade <username>');
        process.exit(1);
      }

      // Check if user exists
      const checkResult = await client.query(
        'SELECT id, username, role FROM members WHERE username = $1',
        [username],
      );

      if (checkResult.rows.length === 0) {
        console.error(`Error: User '${username}' not found`);
        process.exit(1);
      }

      const user = checkResult.rows[0];
      if (user.role === 'admin') {
        console.log(`User '${username}' is already an admin`);
        process.exit(0);
      }

      // Upgrade to admin
      await client.query('UPDATE members SET role = $1 WHERE username = $2', [
        'admin',
        username,
      ]);

      console.log(`User '${username}' upgraded to admin`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin();
