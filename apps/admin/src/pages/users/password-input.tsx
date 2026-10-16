import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useState } from 'react';

import { generatePassword } from '@/lib/password';

type PasswordInputProps = Omit<TextFieldProps, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
};

export function PasswordInput({ value, onChange, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <TextField
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  className="touch-target"
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVisible((current) => !current)}
                  edge="end"
                >
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        variant="outlined"
        onClick={() => {
          onChange(generatePassword());
          setVisible(true);
        }}
        sx={{ flexShrink: 0, minHeight: 40 }}
      >
        Generar
      </Button>
    </Box>
  );
}
