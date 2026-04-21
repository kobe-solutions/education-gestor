import { z } from "zod";

export const createSchoolClassBodySchema = z.object({
  name: z.string().min(2),
  shift: z.string(),
  grade: z.string(),
  termTime: z.string(),
});

export type CreateSchoolClassBody = z.infer<typeof createSchoolClassBodySchema>;
