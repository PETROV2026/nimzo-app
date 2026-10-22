import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useId, useRef, useState, type DragEvent } from 'react';

import { Postbox } from '@/components/postbox';
import { uploadFormIcon, validateFormIcon } from '@/lib/form-icons';
import { tokens } from '@/theme';

import { FormIcon } from './form-icon';

type IconBoxProps = {
  value: string | null;
  onChange: (path: string | null) => void;
  disabled?: boolean;
};

export function IconBox({ value, onChange, disabled }: IconBoxProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = validateFormIcon(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadFormIcon(file));
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) void handleFile(event.dataTransfer.files[0]);
  }

  return (
    <Postbox title="Icono">
      <Box
        component="input"
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/svg+xml,image/png,image/webp"
        className="visually-hidden"
        disabled={disabled || uploading}
        onChange={(event) => void handleFile(event.currentTarget.files?.[0])}
      />
      <Box
        component="label"
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        sx={{
          display: 'grid',
          placeItems: 'center',
          gap: 1,
          p: 2.5,
          border: '1px dashed',
          borderColor: dragging ? tokens.tealText : tokens.inputBorder,
          borderRadius: 1,
          bgcolor: dragging ? tokens.rowAlt : 'transparent',
          cursor: disabled || uploading ? 'default' : 'pointer',
          textAlign: 'center',
          'input:focus-visible + &': {
            outline: `2px solid ${tokens.tealDark}`,
          },
        }}
      >
        <FormIcon path={value} size={88} />
        <Typography variant="body2" color="text.secondary">
          {uploading
            ? 'Subiendo icono…'
            : value
              ? 'Haz clic o arrastra otro archivo para reemplazarlo.'
              : 'Haz clic o arrastra un archivo aquí.'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileOutlined fontSize="small" />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          loading={uploading}
        >
          {value ? 'Reemplazar icono' : 'Subir icono'}
        </Button>
        {value && !uploading && (
          <Link
            component="button"
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="touch-target"
            sx={{ fontSize: 13, color: 'error.main' }}
          >
            Quitar icono
          </Link>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        SVG, PNG o WebP de hasta 512 KB. Se recomienda un SVG de un solo color sobre fondo
        transparente, cuadrado, como los de la app.
      </Typography>
    </Postbox>
  );
}
