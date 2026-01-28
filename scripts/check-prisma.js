const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('prisma.cv:', !!prisma.cv);
  console.log('prisma.cV:', !!prisma.cV);
  console.log('prisma.CV:', !!prisma.CV);
  
  // print all keys
  console.log('Keys:', Object.keys(prisma));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
