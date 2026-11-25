import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';
import { useId, type Ref } from 'react';

import { tokens } from '@/theme';

const Slot = styled('div', {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'invalid',
})<{ active: boolean; invalid: boolean }>(({ theme, active, invalid }) => ({
  flex: 1,
  minWidth: 0,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid',
  borderColor: invalid
    ? theme.palette.error.main
    : active
      ? theme.palette.primary.main
      : tokens.inputBorder,
  borderRadius: theme.shape.borderRadius,
  outline: active ? `2px solid ${theme.palette.primary.main}` : 'none',
  outlineOffset: -1,
  backgroundColor: theme.palette.background.paper,
  fontSize: 24,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}));

const Caret = styled('span')(({ theme }) => ({
  width: 2,
  height: 24,
  backgroundColor: theme.palette.primary.main,
}));

type CodeInputProps = {
  label: string;
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  disabled?: boolean;
  errorId?: string;
};

export function CodeInput({
  label,
  length,
  value,
  onChange,
  onComplete,
  inputRef,
  disabled,
  errorId,
}: CodeInputProps) {
  const id = useId();
  const invalid = errorId !== undefined;

  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: 'block', fontWeight: 500, mb: 1 }}>
        {label}
      </Typography>
      <OTPInput
        id={id}
        ref={inputRef}
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        maxLength={length}
        pattern={REGEXP_ONLY_DIGITS}
        pasteTransformer={(text) => text.replace(/\D/g, '')}
        disabled={disabled}
        autoFocus
        required
        aria-invalid={invalid}
        aria-describedby={errorId}
        render={({ slots }) => (
          <Box sx={{ display: 'flex', gap: 1, opacity: disabled ? 0.6 : 1 }}>
            {slots.map((slot, index) => (
              <Slot key={index} active={slot.isActive} invalid={invalid}>
                {slot.char ?? (slot.hasFakeCaret ? <Caret /> : null)}
              </Slot>
            ))}
          </Box>
        )}
      />
    </Box>
  );
}
