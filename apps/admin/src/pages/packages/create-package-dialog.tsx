import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import {
  serviceFrequencyLabels,
  serviceFrequencySchema,
  type ServiceFrequency,
  type ServicePackage,
} from '@nimzo/shared';
import { useCreate } from '@refinedev/core';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';

type CreatePackageDialogProps = {
  branchId: number;
  taken: ServiceFrequency[];
  onClose: () => void;
};

export function CreatePackageDialog({ branchId, taken, onClose }: CreatePackageDialogProps) {
  const titleId = useId();
  const navigate = useNavigate();
  const available = serviceFrequencySchema.options.filter(
    (frequency) => !taken.includes(frequency),
  );
  const [frequency, setFrequency] = useState<ServiceFrequency | ''>(available[0] ?? '');
  const { mutate: create, mutation } = useCreate<ServicePackage>();

  function submit() {
    if (!frequency) return;
    create(
      {
        resource: 'service_packages',
        values: { branch_id: branchId, frequency },
        successNotification: {
          type: 'success',
          message: 'Paquete agregado',
          description: `Paquete ${serviceFrequencyLabels[frequency].toLowerCase()}`,
        },
      },
      { onSuccess: ({ data }) => navigate(`/packages/${data.id}`) },
    );
  }

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="xs">
      <DialogTitle id={titleId}>Agregar paquete de servicio</DialogTitle>
      <DialogContent>
        {available.length === 0 ? (
          <Typography color="text.secondary">
            Esta sucursal ya tiene un paquete para cada frecuencia.
          </Typography>
        ) : (
          <>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>
              ¿Cada cuánto se hace esta visita? Después eliges sus formatos.
            </Typography>
            <RadioGroup
              aria-labelledby={titleId}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as ServiceFrequency)}
            >
              {available.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={serviceFrequencyLabels[option]}
                />
              ))}
            </RadioGroup>
            {taken.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ya existen: {taken.map((option) => serviceFrequencyLabels[option]).join(', ')}.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        {available.length > 0 && (
          <Button variant="contained" onClick={submit} loading={mutation.isPending}>
            Agregar paquete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
