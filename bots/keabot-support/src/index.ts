import { KeaBotSupport } from './bot.js';

async function bootstrap() {
  const bot = new KeaBotSupport();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}

bootstrap().catch((err) => {
  console.error('SupportBot failed to start:', err);
  process.exit(1);
});

export { KeaBotSupport };
