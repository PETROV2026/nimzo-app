import { z } from 'zod';

import type { Database, Tables } from './database.types';

export type FeedbackMessage = Tables<'feedback_messages'>;

const feedbackKinds = [
  'bug',
  'idea',
] as const satisfies readonly Database['public']['Enums']['feedback_kind'][];

export const feedbackKindSchema = z.enum(feedbackKinds, {
  error: 'Elige si es una falla o una idea',
});

export type FeedbackKind = z.infer<typeof feedbackKindSchema>;

export const feedbackKindLabels: Record<FeedbackKind, string> = {
  bug: 'Falla',
  idea: 'Idea',
};

export const feedbackMessageMaxLength = 4000;
export const feedbackMaxPhotos = 5;
export const feedbackFilesBucket = 'feedback-files';

export const feedbackSchema = z.object({
  kind: feedbackKindSchema,
  message: z
    .string()
    .trim()
    .min(1, 'Escribe tu comentario')
    .max(feedbackMessageMaxLength, `Escribe máximo ${feedbackMessageMaxLength} caracteres`),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;
export type FeedbackValues = z.output<typeof feedbackSchema>;

const screenLabels: Record<string, string> = {
  services: 'Servicios',
  clients: 'Clientes',
  notes: 'Notas',
  profile: 'Perfil',
};

export function feedbackScreenLabel(screen: string): string {
  return screenLabels[screen] ?? screen;
}
