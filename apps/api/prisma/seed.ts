import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing the database...');
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating demo user...');
  const user = await prisma.user.create({
    data: {
      email: 'demo@teamflow.com',
      passwordHash: bcrypt.hashSync('password123', 10),
      name: 'Demo User',
    },
  });

  console.log('Creating demo organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  console.log('Creating membership...');
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: Role.OWNER,
    },
  });

  console.log('Creating project...');
  const project = await prisma.project.create({
    data: {
      name: 'Product Launch',
      description: 'Q4 Product Launch tasks',
      organizationId: org.id,
    },
  });

  console.log('Creating columns...');
  const todoCol = await prisma.column.create({
    data: {
      name: 'To Do',
      position: 1,
      projectId: project.id,
    },
  });

  const inProgressCol = await prisma.column.create({
    data: {
      name: 'In Progress',
      position: 2,
      projectId: project.id,
    },
  });

  const doneCol = await prisma.column.create({
    data: {
      name: 'Done',
      position: 3,
      projectId: project.id,
    },
  });

  console.log('Creating dummy tasks...');
  await prisma.task.createMany({
    data: [
      {
        title: 'Draft launch announcement',
        description: 'Write the blog post and email newsletter.',
        position: 1,
        columnId: todoCol.id,
        projectId: project.id,
        version: 1,
      },
      {
        title: 'Review marketing assets',
        description: 'Check banners and social media images.',
        position: 2,
        columnId: todoCol.id,
        projectId: project.id,
        version: 1,
      },
      {
        title: 'Final QA testing',
        description: 'Ensure everything works perfectly.',
        position: 1,
        columnId: inProgressCol.id,
        projectId: project.id,
        version: 1,
      },
      {
        title: 'Set up staging environment',
        description: 'Staging is ready.',
        position: 1,
        columnId: doneCol.id,
        projectId: project.id,
        version: 1,
      },
    ],
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
