export const githubRepo = 'PETROV2026/nimzo-app';
export const githubUrl = `https://github.com/${githubRepo}`;

export const supabaseProjectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0];
export const supabaseDashboardUrl = `https://supabase.com/dashboard/project/${supabaseProjectRef}`;
export const supabaseSqlEditorUrl = `${supabaseDashboardUrl}/sql/new`;

export const build = {
  commit: __APP_COMMIT__,
  builtAt: __APP_BUILT_AT__,
  migrations: __APP_MIGRATIONS__,
};
