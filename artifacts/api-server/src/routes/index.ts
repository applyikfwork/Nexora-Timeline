import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placesRouter from "./places";
import timelinesRouter from "./timelines";
import insightsRouter from "./insights";
import savedPlacesRouter from "./savedPlaces";
import chatRouter from "./chat";
import analyticsRouter from "./analytics";
import viralRouter from "./viral";
import plannerRouter from "./planner";
import capsuleRouter from "./capsule";
import forecastRouter from "./forecast";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(placesRouter);
router.use(timelinesRouter);
router.use(insightsRouter);
router.use(savedPlacesRouter);
router.use(chatRouter);
router.use(analyticsRouter);
router.use(viralRouter);
router.use(plannerRouter);
router.use(capsuleRouter);
router.use(forecastRouter);
router.use(eventsRouter);

export default router;
