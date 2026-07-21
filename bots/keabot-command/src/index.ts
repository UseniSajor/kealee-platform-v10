import { KeaBotCommand } from './bot';

async function bootstrap() {
  const bot = new KeaBotCommand();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
