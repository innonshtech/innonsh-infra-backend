// @ts-ignore
import 'module-alias/register';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.config';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes/index';

const app: Application = express();

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet());

const cleanOrigin = (url: string) => url.replace(/\/$/, '');

const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://localhost:3000',
  'https://infra.innonsh.com', // Explicit production URL to prevent Vercel CORS blocks
  process.env.FRONTEND_URL ? cleanOrigin(process.env.FRONTEND_URL) : ''
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    const incoming = cleanOrigin(origin);
    const isAllowed = process.env.NODE_ENV === 'development' || 
                      allowedOrigins.includes(incoming) ||
                      allowedOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`[CORS Blocked] Blocked access from origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS security policy'));
    }
  },
  credentials: true
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // max requests per window per IP (increased for ERP multi-endpoint pages)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger ────────────────────────────────────────────────────────────────
const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css';
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: CSS_URL,
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  })
);

// ─── Welcome Route ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: white;">
      <h1 style="color: #38bdf8; font-size: 3rem; margin-bottom: 1rem;">🏗️ Construction ERP API</h1>
      <p style="font-size: 1.25rem; color: #94a3b8; margin-bottom: 2rem;">Server is running smoothly.</p>
      <div style="display: flex; gap: 1rem;">
        <a href="/api-docs" style="padding: 0.75rem 1.5rem; background-color: #38bdf8; color: #0f172a; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.backgroundColor='#7dd3fc'" onmouseout="this.style.backgroundColor='#38bdf8'">View API Docs</a>
        <a href="/api/v1/health" style="padding: 0.75rem 1.5rem; background-color: transparent; color: #38bdf8; border: 1px solid #38bdf8; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.backgroundColor='rgba(56, 189, 248, 0.1)'" onmouseout="this.style.backgroundColor='transparent'">Health Check</a>
      </div>
    </div>
  `);
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

export default app;
