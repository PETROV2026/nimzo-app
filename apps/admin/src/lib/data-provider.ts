import type { DataProvider, HttpError } from '@refinedev/core';
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type RpcName = Parameters<typeof supabase.rpc>[0];

const FUNCTION_PREFIX = 'functions/';

const base = supabaseDataProvider(supabase);

async function invokeFunction(name: string, payload: unknown) {
  const { data, error } = await supabase.functions.invoke(name, { body: payload as object });
  if (!error) return data;

  let message = 'No se pudo completar la acción. Intenta de nuevo.';
  let statusCode = 500;
  if (error instanceof FunctionsHttpError) {
    statusCode = error.context.status;
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      message = 'El servidor respondió con un error inesperado.';
    }
  } else {
    message = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  const httpError: HttpError = { message, statusCode: statusCode === 401 ? 403 : statusCode };
  throw httpError;
}

export const dataProvider: DataProvider = {
  ...base,
  custom: async ({ url, payload }) => {
    if (url.startsWith(FUNCTION_PREFIX)) {
      return { data: await invokeFunction(url.slice(FUNCTION_PREFIX.length), payload) } as never;
    }

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
