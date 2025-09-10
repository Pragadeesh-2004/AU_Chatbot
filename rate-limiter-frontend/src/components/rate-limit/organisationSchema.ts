import { z } from "zod";

export const organisationSchema = z.object({
  max_input_token: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  max_output_token: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  file_count: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  file_size: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  knowledge_base_count: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  knowledge_base_index_size: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
  active_assistant_count: z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Must be a non-negative number",
    }),
});
