import { db } from "../../db";
import { schoolClasses } from "../../db/schema";

type CreateSchoolClassRepositoryInput = {
  schoolId: string;
  name: string;
  grade: string;
  shift: string;
  termTime: string;
};

export async function createSchoolClassRepository(
  input: CreateSchoolClassRepositoryInput,
) {
  const [schoolClass] = await db
    .insert(schoolClasses)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      grade: input.grade,
      shift: input.shift,
      termTime: input.termTime,
    })
    .returning({
      id: schoolClasses.id,
      schoolId: schoolClasses.schoolId,
      name: schoolClasses.name,
      termTime: schoolClasses.termTime,
      grade: schoolClasses.grade,
      shift: schoolClasses.shift,
      createdAt: schoolClasses.createdAt,
    });

  return schoolClass;
}
