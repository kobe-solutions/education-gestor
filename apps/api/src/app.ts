import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
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

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development",
  });

  app.register(fastifyCors, { origin: true });
  app.register(fastifyJwt, { secret: env.JWT_SECRET });
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

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
