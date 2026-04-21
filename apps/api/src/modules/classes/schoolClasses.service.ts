import { createSchoolClassRepository } from "./schoolClasses.repository";

type createSchoolClassServiceInput = {
  schoolId: string;
  name: string;
  grade: string;
  termTime: string;
  shift: string;
};

export async function createSchoolClassService(
  input: createSchoolClassServiceInput,
) {
  const schoolClass = await createSchoolClassRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    grade: input.grade,
    shift: input.shift,
    termTime: input.termTime,
  });

  return schoolClass;
}
