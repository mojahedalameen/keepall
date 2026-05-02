import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import semestersRouter from "./semesters";
import subjectsRouter from "./subjects";
import lecturesRouter from "./lectures";
import notesRouter from "./notes";
import filesRouter from "./files";
import audioRouter from "./audio";
import examsRouter from "./exams";
import tasksRouter from "./tasks";
import remindersRouter from "./reminders";
import tagsRouter from "./tags";
import searchRouter from "./search";
import trashRouter from "./trash";
import profileRouter from "./profile";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/semesters", semestersRouter);
router.use("/subjects", subjectsRouter);
router.use("/lectures", lecturesRouter);
router.use("/notes", notesRouter);
router.use("/files", filesRouter);
router.use("/audio", audioRouter);
router.use("/exams", examsRouter);
router.use("/tasks", tasksRouter);
router.use("/reminders", remindersRouter);
router.use("/tags", tagsRouter);
router.use("/search", searchRouter);
router.use("/trash", trashRouter);
router.use("/profile", profileRouter);
router.use("/admin", adminRouter);

export default router;
