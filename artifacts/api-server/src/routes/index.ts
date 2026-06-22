import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placesRouter from "./places";
import timelinesRouter from "./timelines";
import insightsRouter from "./insights";
import savedPlacesRouter from "./savedPlaces";
import chatRouter from "./chat";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(placesRouter);
router.use(timelinesRouter);
router.use(insightsRouter);
router.use(savedPlacesRouter);
router.use(chatRouter);
router.use(analyticsRouter);

export default router;
