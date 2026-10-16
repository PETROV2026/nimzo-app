import type { DataProvider, HttpError } from '@refinedev/core';
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase';

import { supabase } from '@/lib/supabase';

type RpcName = Parameters<typeof supabase.rpc>[0];

const base = supabaseDataProvider(supabase);

export const dataProvider: DataProvider = {
  ...base,
  custom: async ({ url, payload }) => {
    const { data, error } = await supabase.rpc(url as RpcName, payload as never);
    if (error) {
      const httpError: HttpError = {
        message: error.message,
        statusCode: error.code === '42501' ? 403 : 500,
      };
      throw httpError;
    }
    return { data } as never;
  },
};
