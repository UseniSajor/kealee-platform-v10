import { KeaBotDesign } from './bot.js';

async function bootstrap() {
  const bot = new KeaBotDesign();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
  console.log(`[${bot.name}] Tools: ${bot.getToolDefinitions().map(t => t.name).join(', ')}`);
}

bootstrap().catch((err) => {
  console.error('DesignBot failed to start:', err);
  process.exit(1);
});

export { KeaBotDesign };
