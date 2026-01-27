const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.info('Password:', password);
  console.info('Hashed:', hash);
  console.info('\nSQL Update command:');
  console.info(
    `UPDATE members SET password = '${hash}' WHERE username = 'hec8897';`,
  );
}

// 기본 비밀번호를 'password123'으로 설정
const password = process.argv[2] || 'password123';
hashPassword(password);
