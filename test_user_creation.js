const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'smat91@naver.com' }
    });

    if (existingUser) {
      console.log('User smat91@naver.com already exists:', existingUser);
      return;
    }

    // Create new user
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'smat91@naver.com',
        passwordHash: hashedPassword,
        nickname: '테스트사용자',
        avatarUrl: null,
      }
    });

    console.log('Created test user:', user);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
