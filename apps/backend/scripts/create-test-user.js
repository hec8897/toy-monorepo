const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createTestUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.jxgdqzdgqypmwrxmmaem:rlaekdns786@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if test user exists
    const checkResult = await client.query(
      "SELECT id, username FROM members WHERE username = 'testuser'"
    );

    if (checkResult.rows.length > 0) {
      console.log('👤 Test user already exists:', checkResult.rows[0]);

      // Update password
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      await client.query(
        "UPDATE members SET password = $1 WHERE username = 'testuser'",
        [hashedPassword]
      );
      console.log('✅ Password updated for testuser');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      const result = await client.query(
        `INSERT INTO members (username, name, password, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, name`,
        ['testuser', 'Test User', hashedPassword, '010-1234-5678']
      );
      console.log('✅ Test user created:', result.rows[0]);
    }

    console.log('\n📝 Login credentials:');
    console.log('Username: testuser');
    console.log('Password: testpassword');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createTestUser();
