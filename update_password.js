const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    // 새 비밀번호 해시화
    const newPassword = 'Wjdwhdans91!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 데이터베이스 업데이트
    const result = await prisma.user.update({
      where: {
        email: 'smat91@naver.com'
      },
      data: {
        passwordHash: hashedPassword
      }
    });
    
    console.log('비밀번호가 성공적으로 업데이트되었습니다.');
    console.log('이메일:', result.email);
    console.log('닉네임:', result.nickname);
    
  } catch (error) {
    console.error('비밀번호 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
