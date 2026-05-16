import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { ZodError } from "zod";
import { env } from "./env";
import { authRoutes } from "./modules/auth/auth.routes";
import { schoolsRoutes } from "./modules/schools/schools.routes";
import { secretariasRoutes } from "./modules/secretarias/secretarias.routes";
import { subjectsRoutes } from "./modules/subjects/subjects.routes";
import { teachersRoutes } from "./modules/teachers/teachers.routes";
import { studentsRoutes } from "./modules/students/students.routes";
import { schoolClassesRoutes } from "./modules/classes/schoolClasses.routes";
import { academicPeriodsRoutes } from "./modules/academicPeriods/academicPeriods.routes";
import { academicRoutes } from "./modules/academic/academic.routes";
import { financialRoutes } from "./modules/financial/financial.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { educationLevelsRoutes } from "./modules/educationLevels/educationLevels.routes";
import { seriesRoutes } from "./modules/series/series.routes";
import { timetableRoutes } from "./modules/timetable/timetable.routes";
import { auditRoutes } from "./modules/audit/audit.routes";

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development",
  });

  app.register(fastifyCors, { origin: true });
  app.register(fastifyJwt, { secret: env.JWT_SECRET });
  app.register(fastifyMultipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  app.register(authRoutes);
  app.register(schoolsRoutes);
  app.register(secretariasRoutes);
  app.register(subjectsRoutes);
  app.register(teachersRoutes);
  app.register(studentsRoutes);
  app.register(schoolClassesRoutes);
  app.register(academicPeriodsRoutes);
  app.register(academicRoutes);
  app.register(financialRoutes);
  app.register(dashboardRoutes);
  app.register(educationLevelsRoutes);
  app.register(seriesRoutes);
  app.register(timetableRoutes);
  app.register(auditRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ message: "Validation error", issues: error.issues });
    }
    reply.send(error);
  });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
