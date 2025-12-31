import { PrismaClient, UserRole, ProjectStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ra-engenharia.com' },
    update: {},
    create: {
      email: 'admin@ra-engenharia.com',
      name: 'Administrador',
      password: adminPassword,
      role: UserRole.ADMIN,
      department: 'Administração',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@ra-engenharia.com' },
    update: {},
    create: {
      email: 'gerente@ra-engenharia.com',
      name: 'João Silva',
      password: managerPassword,
      role: UserRole.MANAGER,
      department: 'Engenharia',
    },
  });
  console.log('Created manager user:', manager.email);

  // Create engineer user
  const engineerPassword = await bcrypt.hash('engineer123', 12);
  const engineer = await prisma.user.upsert({
    where: { email: 'engenheiro@ra-engenharia.com' },
    update: {},
    create: {
      email: 'engenheiro@ra-engenharia.com',
      name: 'Maria Santos',
      password: engineerPassword,
      role: UserRole.ENGINEER,
      department: 'Engenharia Civil',
    },
  });
  console.log('Created engineer user:', engineer.email);

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { document: '12.345.678/0001-99' },
    update: {},
    create: {
      name: 'Construtora ABC Ltda',
      email: 'contato@construtoraabc.com.br',
      phone: '(11) 3456-7890',
      document: '12.345.678/0001-99',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
  });
  console.log('Created client:', client1.name);

  const client2 = await prisma.client.upsert({
    where: { document: '98.765.432/0001-11' },
    update: {},
    create: {
      name: 'Incorporadora XYZ S.A.',
      email: 'projetos@xyz.com.br',
      phone: '(11) 2345-6789',
      document: '98.765.432/0001-11',
      address: 'Rua Augusta, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01304-000',
    },
  });
  console.log('Created client:', client2.name);

  // Create sample project
  const project = await prisma.project.upsert({
    where: { code: 'PROJ-2025-001' },
    update: {},
    create: {
      name: 'Edifício Comercial Centro',
      code: 'PROJ-2025-001',
      description: 'Construção de edifício comercial de 15 andares no centro da cidade',
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2026-06-30'),
      estimatedCost: 15000000,
      progress: 25,
      address: 'Rua da Consolação, 2500',
      city: 'São Paulo',
      state: 'SP',
      clientId: client1.id,
      managerId: manager.id,
    },
  });
  console.log('Created project:', project.name);

  // Create sample tasks
  const tasks = [
    {
      title: 'Levantamento topográfico',
      description: 'Realizar levantamento topográfico completo do terreno',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-02-01'),
      completedAt: new Date('2025-01-28'),
    },
    {
      title: 'Projeto arquitetônico',
      description: 'Desenvolver projeto arquitetônico completo',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-03-15'),
    },
    {
      title: 'Projeto estrutural',
      description: 'Elaborar projeto estrutural do edifício',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-04-30'),
    },
    {
      title: 'Aprovação na prefeitura',
      description: 'Protocolar e acompanhar aprovação do projeto',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-05-30'),
    },
    {
      title: 'Contratação de mão de obra',
      description: 'Selecionar e contratar equipe de construção',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-06-15'),
    },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await prisma.task.create({
      data: {
        ...task,
        order: i + 1,
        projectId: project.id,
        creatorId: manager.id,
        assigneeId: engineer.id,
      },
    });
  }
  console.log(`Created ${tasks.length} tasks`);

  // Create tags
  const tags = [
    { name: 'Urgente', color: '#ef4444' },
    { name: 'Documentação', color: '#3b82f6' },
    { name: 'Reunião', color: '#8b5cf6' },
    { name: 'Aprovação', color: '#f59e0b' },
    { name: 'Revisão', color: '#10b981' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log(`Created ${tags.length} tags`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
