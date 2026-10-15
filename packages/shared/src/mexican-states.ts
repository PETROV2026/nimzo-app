import { z } from 'zod';

export const mexicanStateLabels = {
  AGU: 'Aguascalientes',
  BCN: 'Baja California',
  BCS: 'Baja California Sur',
  CAM: 'Campeche',
  CHH: 'Chihuahua',
  CHP: 'Chiapas',
  CMX: 'Ciudad de México',
  COA: 'Coahuila',
  COL: 'Colima',
  DUR: 'Durango',
  GRO: 'Guerrero',
  GUA: 'Guanajuato',
  HID: 'Hidalgo',
  JAL: 'Jalisco',
  MEX: 'Estado de México',
  MIC: 'Michoacán',
  MOR: 'Morelos',
  NAY: 'Nayarit',
  NLE: 'Nuevo León',
  OAX: 'Oaxaca',
  PUE: 'Puebla',
  QUE: 'Querétaro',
  ROO: 'Quintana Roo',
  SIN: 'Sinaloa',
  SLP: 'San Luis Potosí',
  SON: 'Sonora',
  TAB: 'Tabasco',
  TAM: 'Tamaulipas',
  TLA: 'Tlaxcala',
  VER: 'Veracruz',
  YUC: 'Yucatán',
  ZAC: 'Zacatecas',
} as const;

export type MexicanState = keyof typeof mexicanStateLabels;

export const mexicanStateSchema = z.enum(
  Object.keys(mexicanStateLabels) as [MexicanState, ...MexicanState[]],
);

export const mexicanStates = (Object.keys(mexicanStateLabels) as MexicanState[]).sort((a, b) =>
  mexicanStateLabels[a].localeCompare(mexicanStateLabels[b], 'es'),
);
