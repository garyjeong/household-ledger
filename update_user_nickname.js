const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserNickname() {
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'smat91@naver.com' },
      data: { nickname: 'Gary' }
    });

    console.log('사용자 닉네임이 업데이트되었습니다:', {
      id: updatedUser.id.toString(),
      email: updatedUser.email,
      nickname: updatedUser.nickname,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserNickname();
