import { z } from 'zod';

export const checkStatusSchema = z.enum(['na', 'x', 'ok']);
export const checkValueSchema = z.object({
  status: checkStatusSchema,
  value: z.number().optional(),
});
export const yesNoValueSchema = z.enum(['yes', 'no']);
export const textValueSchema = z.union([z.string(), z.number()]);
export const dateValueSchema = z.iso.date();
export const timeValueSchema = z.iso.time();
export const optionValueSchema = z.string();
export const checkboxValueSchema = z.boolean();

export type CheckStatus = z.infer<typeof checkStatusSchema>;
export type CheckValue = z.infer<typeof checkValueSchema>;
export type YesNoValue = z.infer<typeof yesNoValueSchema>;
export type TextValue = z.infer<typeof textValueSchema>;
export type DateValue = z.infer<typeof dateValueSchema>;
export type TimeValue = z.infer<typeof timeValueSchema>;
export type OptionValue = z.infer<typeof optionValueSchema>;
export type CheckboxValue = z.infer<typeof checkboxValueSchema>;
