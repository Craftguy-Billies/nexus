import { createApp } from './app';
import { config } from './config';
import prisma from './config/database';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected');

    const { httpServer } = await createApp();

    // Start BullMQ workers (optional - requires Redis)
    try {
      const { startAllWorkers } = await import('./jobs/workers');
      startAllWorkers();
    } catch (err) {
      console.warn('BullMQ workers not started (Redis may not be available):', (err as Error).message);
    }

    httpServer.listen(config.port, () => {
      console.log(`
===========================================
  Nexus AI Backend Server
===========================================
  Environment: ${config.env}
  Port:        ${config.port}
  GraphQL:     http://localhost:${config.port}/graphql
  REST API:    http://localhost:${config.port}/api
  Health:      http://localhost:${config.port}/health
===========================================
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
