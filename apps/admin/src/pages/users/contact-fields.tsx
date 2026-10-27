import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import { mexicanStateLabels, mexicanStates, type ProfileDetailsInput } from '@nimzo/shared';
import { Controller, type Control } from 'react-hook-form';

type ContactFieldsProps<T extends ProfileDetailsInput> = { control: Control<T> };

export function ContactFields<T extends ProfileDetailsInput>({ control }: ContactFieldsProps<T>) {
  const details = control as unknown as Control<ProfileDetailsInput>;
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Controller
          control={details}
          name="phone"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Teléfono (opcional)"
              type="tel"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          control={details}
          name="city"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              label="Ciudad (opcional)"
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? 'Dónde vive. Ej. San Nicolás'}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          control={details}
          name="state"
          render={({ field, fieldState }) => (
            <Autocomplete
              options={mexicanStates}
              value={field.value ?? null}
              onChange={(_, value) => field.onChange(value)}
              onBlur={field.onBlur}
              getOptionLabel={(code) => mexicanStateLabels[code]}
              noOptionsText="No hay estados con ese nombre"
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={field.ref}
                  label="Estado (opcional)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          )}
        />
      </Grid>
    </Grid>
  );
}
