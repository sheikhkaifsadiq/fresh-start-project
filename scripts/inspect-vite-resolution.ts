import { resolve } from 'path';
import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    configFile: resolve('./vite.config.ts'),
  });
  
  const pluginContainer = server.pluginContainer;
  const resolved = await pluginContainer.resolveId('#tanstack-router-entry', undefined);
  
  console.log('Resolved #tanstack-router-entry to:');
  console.log(resolved);
  
  await server.close();
}

main().catch(console.error);
