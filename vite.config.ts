import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);

  // Load fallback env vars from vercel.json if not present in system environment
  try {
    const fs = await import('fs');
    const path = await import('path');
    const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      if (vercelConfig.env) {
        for (const [key, value] of Object.entries(vercelConfig.env)) {
          if (!env[key]) {
            env[key] = value;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to load env from vercel.json:", err);
  }

  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
    processEnvDefines[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
