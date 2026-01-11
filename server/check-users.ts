import prisma from './src/utils/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true, passwordHash: true }
  });
  console.log('Users in database:');
  users.forEach(u => {
    console.log(`  ${u.email} (${u.role}, ${u.status}) - hash starts with: ${u.passwordHash.substring(0, 20)}...`);
  });
  await prisma.$disconnect();
}

main();

