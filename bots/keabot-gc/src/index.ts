import { KeaBotGC } from './bot';

async function bootstrap() {
  const bot = new KeaBotGC();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
