import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { authenticate } from "../../middlewares/auth";
import { authorizeRoles } from "../../middlewares/authorize";
import { injectTenant } from "../../middlewares/tenant";
import { createSchoolClassBodySchema } from "./schoolClasses.schema";
import { createSchoolClassService } from "./schoolClasses.service";

export async function schoolClassesRoutes(app: FastifyInstance) {
  app.post(
    "/school-classes",
    {
      preHandler: [
        authenticate,
        injectTenant,
        authorizeRoles(["admin", "gestor"]),
      ],
    },
    async (request, reply) => {
      try {
        const payload = request.user as { schoolId: string };

        const body = createSchoolClassBodySchema.parse(request.body);

        const schoolClass = await createSchoolClassService({
          schoolId: payload.schoolId,
          name: body.name,
          grade: body.grade,
          shift: body.shift,
          termTime: body.termTime,
        });

        return reply.status(201).send(schoolClass);
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            message: "Validation error",
            issues: error.issues,
          });
        }

        if (
          error instanceof Error &&
          error.message === "Teacher already exists with this email"
        ) {
          return reply.status(409).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
