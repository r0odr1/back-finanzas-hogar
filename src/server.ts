import app from './app';
import { env } from './config/env';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`API Finanzas Hogar ejecutándose en http://localhost:${env.port}`);
  console.log(`Entorno: ${env.nodeEnv}`);
});