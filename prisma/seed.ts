import { PrismaClient, Role, Priority, TaskStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  // Simple sha256 simulation for seed; argon2 applied in api service
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding TeamFlow database...');

  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const demoAdmin = await prisma.user.create({
    data: {
      email: 'admin@teamflow.dev',
      passwordHash: await hashPassword('Password123!'),
      firstName: 'Ahmad',
      lastName: 'Zayab',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const demoManager = await prisma.user.create({
    data: {
      email: 'sarah.pm@teamflow.dev',
      passwordHash: await hashPassword('Password123!'),
      firstName: 'Sarah',
      lastName: 'Jenkins',
    },
  });

  const demoDev = await prisma.user.create({
    data: {
      email: 'alex.dev@teamflow.dev',
      passwordHash: await hashPassword('Password123!'),
      firstName: 'Alex',
      lastName: 'Chen',
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Enterprise Solutions',
      slug: 'acme-corp',
      members: {
        create: [
          { userId: demoAdmin.id, role: Role.OWNER },
          { userId: demoManager.id, role: Role.PROJECT_MANAGER },
          { userId: demoDev.id, role: Role.MEMBER },
        ],
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      title: 'Real-time Core Platform v2',
      key: 'CORE',
      description: 'Mission critical project management migration to Next.js 16 and NestJS',
      organizationId: org.id,
      tasks: {
        create: [
          {
            title: 'Design distributed WebSocket rooms for live cursor sync',
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.URGENT,
            order: 1000.0,
            creatorId: demoAdmin.id,
            assigneeId: demoDev.id,
          },
          {
            title: 'Implement JWT refresh-token rotation in NestJS guards',
            status: TaskStatus.DONE,
            priority: Priority.HIGH,
            order: 2000.0,
            creatorId: demoManager.id,
            assigneeId: demoAdmin.id,
          },
          {
            title: 'Optimize Postgres compound index on (projectId, status, order)',
            status: TaskStatus.TODO,
            priority: Priority.MEDIUM,
            order: 3000.0,
            creatorId: demoAdmin.id,
            assigneeId: demoDev.id,
          },
        ],
      },
    },
  });

  console.log(`Successfully seeded tenant: ${org.name} with project: ${project.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
