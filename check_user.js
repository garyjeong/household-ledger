const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'smat91@naver.com' }
    });

    if (user) {
      console.log('현재 사용자 정보:', {
        id: user.id.toString(),
        email: user.email,
        nickname: user.nickname,
        createdAt: user.createdAt
      });
    } else {
      console.log('사용자를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
