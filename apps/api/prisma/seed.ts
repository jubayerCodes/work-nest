import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('Password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@worknest.io' },
    update: {},
    create: {
      email: 'demo@worknest.io',
      name: 'Demo User',
      passwordHash,
      preferences: { create: {} },
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create a demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      description: 'Main workspace for Acme Corp team',
      accentColor: '#6366f1',
      slug: 'acme-corp',
      members: {
        create: { userId: user.id, role: 'ADMIN' },
      },
    },
  });

  console.log(`✅ Created workspace: ${workspace.name}`);

  // Create a demo goal
  const goal = await prisma.goal.upsert({
    where: { id: 'seed-goal-1' },
    update: {},
    create: {
      id: 'seed-goal-1',
      title: 'Launch v1.0',
      description: '<p>Get the product ready for public launch.</p>',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ownerId: user.id,
      workspaceId: workspace.id,
      milestones: {
        create: [
          { title: 'Complete backend API', completed: true },
          { title: 'Build frontend UI', completed: false },
          { title: 'Deploy to production', completed: false },
        ],
      },
    },
  });

  console.log(`✅ Created goal: ${goal.title}`);

  // Create demo action items
  await prisma.actionItem.createMany({
    data: [
      { title: 'Set up CI/CD pipeline', priority: 'HIGH', status: 'TODO', workspaceId: workspace.id, goalId: goal.id },
      { title: 'Write API documentation', priority: 'MEDIUM', status: 'IN_PROGRESS', assigneeId: user.id, workspaceId: workspace.id },
      { title: 'Design system setup', priority: 'HIGH', status: 'DONE', assigneeId: user.id, workspaceId: workspace.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created action items');

  // Create demo announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to WorkNest! 🎉',
      content: '<p>We\'re excited to have you here. This is your collaborative hub for managing goals, tasks, and announcements.</p>',
      pinned: true,
      authorId: user.id,
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Created announcement');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('📧 Login: demo@worknest.io');
  console.log('🔑 Password: Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
