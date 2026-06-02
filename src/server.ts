// @ts-ignore
import 'module-alias/register';
import app from './app';
import { env } from './config/env.config';

const PORT = Number(env.PORT) || 5000;

console.log('Starting server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on: http://0.0.0.0:${PORT}`);
  console.log(`📄 API Documentation: http://0.0.0.0:${PORT}/api-docs`);
});

// Remove custom handlers for a moment to let Node crash naturally if it needs to
