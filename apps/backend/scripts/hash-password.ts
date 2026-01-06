import * as bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password:', password);
  console.log('Hashed:', hash);
  console.log('\nSQL Update command:');
  console.log(`UPDATE members SET password = '${hash}' WHERE username = 'hec8897';`);
}

// 기본 비밀번호를 'password123'으로 설정
const password = process.argv[2] || 'password123';
hashPassword(password);
