import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import householdRoutes from './routes/household.routes';
import dashboardRoutes from './routes/dashboard.routes';
import movementRoutes from './routes/movement.routes';
import catalogRoutes from './routes/catalog.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/catalogs', catalogRoutes);

export default app;