import { Router } from 'express';
import propertiesRouter from './properties';
import buildingsRouter from './buildings';
import floorsRouter from './floors';
import roomsRouter from './rooms';
import bedsRouter from './beds';
import guestsRouter from './guests';
import paymentsRouter from './payments';
import complaintsRouter from './complaints';
import staffRouter from './staff';
import dashboardRouter from './dashboard';
import activityRouter from './activity';
import checkinRouter from './checkin';
import bookingsRouter from './bookings';
import utilitiesRouter from './utilities';
import aiRouter from './ai';

const router = Router();

router.get('/healthz', (_req, res) => res.json({ status: 'ok', product: 'RENTAQ' }));

router.use(propertiesRouter);
router.use(buildingsRouter);
router.use(floorsRouter);
router.use(roomsRouter);
router.use(bedsRouter);
router.use(guestsRouter);
router.use(paymentsRouter);
router.use(complaintsRouter);
router.use(staffRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(checkinRouter);
router.use(bookingsRouter);
router.use(utilitiesRouter);
router.use(aiRouter);

export default router;
