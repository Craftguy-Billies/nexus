import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking follow records...');
  
  const follows = await prisma.follow.findMany({
    include: {
      follower: true,
    }
  });
  
  console.log(`Total follows: ${follows.length}`);
  for (const follow of follows) {
    console.log(`Follow: ${follow.follower.username} -> ${follow.followingId} (${follow.status})`);
  }
  
  console.log('\nChecking like records...');
  const likes = await prisma.like.findMany();
  
  console.log(`Total likes: ${likes.length}`);
  for (const like of likes) {
    console.log(`Like: authorId ${like.authorId} -> post ${like.postId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
