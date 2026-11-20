export type UploadOutcome = 'sent' | 'rejected' | 'retry';

export function feedbackPhotoPath(technicianId: string, messageId: string, index: number) {
  return `${technicianId}/${messageId}/photo-${index + 1}.jpg`;
}

export function uploadOutcome(error: { code: string } | null): UploadOutcome {
  if (!error) return 'sent';
  if (error.code === '23505') return 'sent';
  if (/^2[23]/.test(error.code) || error.code === '42501' || error.code === 'P0001') {
    return 'rejected';
  }
  return 'retry';
}

export function isAlreadyUploaded(error: { statusCode?: string; message?: string } | null) {
  if (!error) return false;
  return error.statusCode === '409' || /already exists/i.test(error.message ?? '');
}
