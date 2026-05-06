import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing database counts...');

  // Sync AI character follower counts
  const aiCharacters = await prisma.aICharacter.findMany();
  for (const char of aiCharacters) {
    const actualFollowers = await prisma.follow.count({
      where: { followingId: char.id, status: 'active' }
    });
    const actualPosts = await prisma.post.count({
      where: { authorId: char.id, authorType: 'ai', isArchived: false }
    });
    
    await prisma.aICharacter.update({
      where: { id: char.id },
      data: {
        followerCount: actualFollowers,
        totalPosts: actualPosts,
      }
    });
    
    console.log(`Updated ${char.username}: followers=${actualFollowers}, posts=${actualPosts}`);
  }

  // Sync post like counts
  const posts = await prisma.post.findMany();
  for (const post of posts) {
    const actualLikes = await prisma.like.count({
      where: { postId: post.id }
    });
    const actualComments = await prisma.comment.count({
      where: { postId: post.id }
    });
    
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likesCount: actualLikes,
        commentsCount: actualComments,
      }
    });
    
    console.log(`Updated post ${post.id}: likes=${actualLikes}, comments=${actualComments}`);
  }

  console.log('Sync complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
