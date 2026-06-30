import { resolve } from 'path';
import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    configFile: resolve('./vite.config.ts'),
  });
  
  const pluginContainer = server.pluginContainer;
  const resolvedId = await pluginContainer.resolveId('#tanstack-router-entry', undefined);
  console.log('Resolved:', resolvedId?.id);
  
  if (resolvedId) {
    const loaded = await pluginContainer.load(resolvedId.id);
    console.log('Loaded Code:');
    console.log(loaded);
  }

  await server.close();
}

main().catch(console.error);
