import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();

// Extend Prisma Client to automatically set userId when creating a user
// This extension intercepts user creation and ensures userId is set to id if not provided
const prisma = basePrisma.$extends({
  name: 'autoSetUserId',
  query: {
    user: {
      async create({ args, query }) {
        const data = args.data as any;
        const hasUserId = data?.userId !== null && data?.userId !== undefined && data?.userId !== '';
        
        // If userId is not provided, create user with a temporary value, then update it
        if (!hasUserId) {
          // Use transaction to ensure atomicity
          return await basePrisma.$transaction(async (tx: any) => {
            // Create with temporary userId
            const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const user = await tx.user.create({
              data: {
                ...data,
                userId: tempUserId,
              },
            });
            
            // Immediately update userId to match id
            return await tx.user.update({
              where: { id: user.id },
              data: { userId: user.id },
            });
          });
        }
        
        // If userId is provided, use the normal create flow
        return await query(args);
      },
    },
  },
}) as any;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma as any;

export default prisma;

