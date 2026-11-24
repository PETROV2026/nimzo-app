import type { LocalServiceForm } from '@/service-forms/service-forms-db';

export type Signer = 'supervisor' | 'technician';

type ReportBase = {
  id: string;
  form: LocalServiceForm;
  client: string;
  branch: string;
  system: string | null;
};

export type ReportListItem = ReportBase &
  (
    | { status: 'draft'; updatedAt: string; missingFields: number }
    | { status: 'pending'; updatedAt: string; missingSignatures: Signer[] }
    | { status: 'sent'; folio: number; sentAt: string }
  );

const formsUpdatedAt = '2026-11-01T08:00:00-08:00';

const dieselPump: LocalServiceForm = {
  code: 'diesel_pump_annual',
  name: 'Bomba diésel',
  subtitle: 'Anual',
  icon_path: null,
  updated_at: formsUpdatedAt,
};

const fireHoses: LocalServiceForm = {
  code: 'fire_hoses',
  name: 'Mangueras contra incendio',
  subtitle: null,
  icon_path: null,
  updated_at: formsUpdatedAt,
};

const smokeDetectors: LocalServiceForm = {
  code: 'smoke_detectors_semiannual',
  name: 'Detectores de humo',
  subtitle: 'Semestral',
  icon_path: null,
  updated_at: formsUpdatedAt,
};

export const mockReports: ReportListItem[] = [
  {
    id: 'demo-draft-1',
    status: 'draft',
    form: dieselPump,
    client: 'Cliente demo 1',
    branch: 'Sucursal demo Centro',
    system: 'Bomba demo 1',
    updatedAt: '2026-11-19T16:42:00-08:00',
    missingFields: 4,
  },
  {
    id: 'demo-draft-2',
    status: 'draft',
    form: fireHoses,
    client: 'Cliente demo 2',
    branch: 'Sucursal demo Norte',
    system: null,
    updatedAt: '2026-11-18T10:05:00-08:00',
    missingFields: 1,
  },
  {
    id: 'demo-draft-3',
    status: 'draft',
    form: smokeDetectors,
    client: 'Cliente demo 3',
    branch: 'Sucursal demo Sur',
    system: 'Detectores demo planta baja',
    updatedAt: '2026-11-15T13:30:00-08:00',
    missingFields: 12,
  },
  {
    id: 'demo-pending-1',
    status: 'pending',
    form: fireHoses,
    client: 'Cliente demo 1',
    branch: 'Sucursal demo Centro',
    system: null,
    updatedAt: '2026-11-19T12:10:00-08:00',
    missingSignatures: ['supervisor'],
  },
  {
    id: 'demo-pending-2',
    status: 'pending',
    form: dieselPump,
    client: 'Cliente demo 4',
    branch: 'Sucursal demo Oriente',
    system: 'Bomba demo 2',
    updatedAt: '2026-11-17T09:45:00-08:00',
    missingSignatures: ['supervisor', 'technician'],
  },
  {
    id: 'demo-pending-3',
    status: 'pending',
    form: smokeDetectors,
    client: 'Cliente demo 2',
    branch: 'Sucursal demo Norte',
    system: null,
    updatedAt: '2026-11-16T17:20:00-08:00',
    missingSignatures: ['technician'],
  },
  {
    id: 'demo-sent-1',
    status: 'sent',
    form: dieselPump,
    client: 'Cliente demo 3',
    branch: 'Sucursal demo Sur',
    system: 'Bomba demo 3',
    folio: 91,
    sentAt: '2026-11-14T11:02:00-08:00',
  },
  {
    id: 'demo-sent-2',
    status: 'sent',
    form: fireHoses,
    client: 'Cliente demo 4',
    branch: 'Sucursal demo Oriente',
    system: null,
    folio: 90,
    sentAt: '2026-11-12T15:48:00-08:00',
  },
  {
    id: 'demo-sent-3',
    status: 'sent',
    form: smokeDetectors,
    client: 'Cliente demo 1',
    branch: 'Sucursal demo Centro',
    system: 'Detectores demo azotea',
    folio: 89,
    sentAt: '2026-11-10T08:30:00-08:00',
  },
];
