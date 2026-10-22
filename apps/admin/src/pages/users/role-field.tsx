import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { userRoleDescriptions, userRoleLabels, userRoleSchema, type UserRole } from '@nimzo/shared';

type RoleFieldProps = {
  value: UserRole | undefined;
  onChange: (role: UserRole) => void;
  error?: string;
  disabled?: boolean;
  helperText?: string;
};

export function RoleField({ value, onChange, error, disabled, helperText }: RoleFieldProps) {
  return (
    <FormControl component="fieldset" error={!!error} disabled={disabled} required>
      <FormLabel component="legend" className="visually-hidden">
        Rol
      </FormLabel>
      <RadioGroup
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value as UserRole)}
        sx={{ gap: 0.5 }}
      >
        {userRoleSchema.options.map((role) => (
          <FormControlLabel
            key={role}
            value={role}
            control={<Radio />}
            sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { mt: -0.75 } }}
            label={
              <>
                <Typography sx={{ fontWeight: 500 }}>{userRoleLabels[role]}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {userRoleDescriptions[role]}
                </Typography>
              </>
            }
          />
        ))}
      </RadioGroup>
      {(error || helperText) && <FormHelperText>{error ?? helperText}</FormHelperText>}
    </FormControl>
  );
}
