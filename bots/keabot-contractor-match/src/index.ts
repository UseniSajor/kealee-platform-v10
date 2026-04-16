import { KeaBotContractorMatch } from './bot.js';

async function bootstrap() {
  const bot = new KeaBotContractorMatch();
  await bot.initialize();
  console.log(`[${bot.name}] Ready with ${bot.getToolDefinitions().length} tools`);
}

bootstrap().catch((err) => {
  console.error('ContractorMatchBot failed to start:', err);
  process.exit(1);
});

export { KeaBotContractorMatch };
