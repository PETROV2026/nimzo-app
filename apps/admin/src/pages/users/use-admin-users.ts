import type { UserRole } from '@nimzo/shared';
import { useCustomMutation, useInvalidate } from '@refinedev/core';

export type AdminUsersAction =
  | { action: 'create'; full_name: string; email: string; role: UserRole; password: string }
  | { action: 'update'; user_id: string; full_name: string; role: UserRole }
  | { action: 'set_active'; user_id: string; active: boolean }
  | { action: 'reset_password'; user_id: string; password: string };

export function useAdminUsers() {
  const { mutateAsync, mutation } = useCustomMutation<{ id: string }>();
  const invalidate = useInvalidate();

  async function run(
    values: AdminUsersAction,
    success?: { message: string; description?: string },
  ) {
    const response = await mutateAsync({
      url: 'functions/admin-users',
      method: 'post',
      values,
      successNotification: success ? { type: 'success', ...success } : false,
      errorNotification: (error) => ({
        type: 'error',
        message: 'No se pudo completar la acción',
        description: error?.message,
      }),
    });
    await invalidate({ resource: 'profiles', invalidates: ['list', 'many', 'detail'] });
    return response.data;
  }

  return { run, pending: mutation.isPending };
}
