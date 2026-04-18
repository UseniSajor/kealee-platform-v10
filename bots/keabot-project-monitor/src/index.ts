import { KeaBotProjectMonitor } from './bot.js';

async function bootstrap() {
  const bot = new KeaBotProjectMonitor();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}

bootstrap().catch((err) => {
  console.error('ProjectMonitorBot failed to start:', err);
  process.exit(1);
});

export { KeaBotProjectMonitor };
