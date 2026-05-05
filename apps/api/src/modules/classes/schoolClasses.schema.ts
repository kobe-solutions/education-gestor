import { z } from "zod";

export const createSchoolClassBodySchema = z.object({
  name: z.string().min(2),
  shift: z.string(),
  grade: z.string(),
  termTime: z.string(),
});

export const updateSchoolClassBodySchema = z.object({
  name: z.string().min(2).optional(),
  shift: z.string().optional(),
  grade: z.string().optional(),
  termTime: z.string().optional(),
})

export const addMemberBodySchema = z.object({
  id: z.string().uuid(),
})

export type CreateSchoolClassBody = z.infer<typeof createSchoolClassBodySchema>
export type UpdateSchoolClassBody = z.infer<typeof updateSchoolClassBodySchema>
export type AddMemberBody = z.infer<typeof addMemberBodySchema>
