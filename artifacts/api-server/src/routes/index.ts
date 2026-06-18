import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import buildingsRouter from "./buildings";
import floorsRouter from "./floors";
import roomsRouter from "./rooms";
import bedsRouter from "./beds";
import guestsRouter from "./guests";
import paymentsRouter from "./payments";
import complaintsRouter from "./complaints";
import staffRouter from "./staff";
import dashboardRouter from "./dashboard";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
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

export default router;
