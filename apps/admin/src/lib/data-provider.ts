import { describeDatabaseError } from '@nimzo/shared';
import type { DataProvider, HttpError } from '@refinedev/core';
import { dataProvider as supabaseDataProvider } from '@refinedev/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type RpcName = Parameters<typeof supabase.rpc>[0];

const FUNCTION_PREFIX = 'functions/';

function friendlyError(error: unknown): HttpError {
  const failure = (error ?? {}) as { code?: string; message?: string };
  const code = failure.code ?? '';
  const statusCode = code.startsWith('PGRST3')
    ? 401
    : code === '42501'
      ? 403
      : code === '23505'
        ? 409
        : code.startsWith('22') || code.startsWith('23') || code === 'P0001'
          ? 422
          : 500;
  return { message: describeDatabaseError(failure), statusCode, code };
}

function withFriendlyErrors(provider: DataProvider): DataProvider {
  const wrapped: Record<string, unknown> = { ...provider };
  for (const [name, method] of Object.entries(provider)) {
    if (typeof method !== 'function' || name === 'getApiUrl') continue;
    wrapped[name] = async (...args: unknown[]) => {
      try {
        return await (method as (...params: unknown[]) => Promise<unknown>)(...args);
      } catch (error) {
        throw friendlyError(error);
      }
    };
  }
  return wrapped as DataProvider;
}

const base = withFriendlyErrors(supabaseDataProvider(supabase));

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
    if (error) throw friendlyError(error);
    return { data } as never;
  },
};
