import type { ServiceForm } from '@nimzo/shared';

export type ServiceFormSummary = Pick<ServiceForm, 'code' | 'name' | 'subtitle' | 'icon_path'>;

const form = (code: string, name: string, subtitle: string | null = null): ServiceFormSummary => ({
  code,
  name,
  subtitle,
  icon_path: null,
});

export const mockServiceForms: ServiceFormSummary[] = [
  form('clean_agent_monthly', 'Agentes limpios', 'Mensual'),
  form('clean_agent_semiannual_annual', 'Agentes limpios', 'Semestral y anual'),
  form('diesel_pump_weekly', 'Bomba diésel', 'Semanal'),
  form('diesel_pump_monthly', 'Bomba diésel', 'Mensual'),
  form('diesel_pump_annual', 'Bomba diésel', 'Anual'),
  form('electric_pump', 'Bomba eléctrica'),
  form('cabinets_racks_monthly', 'Gabinetes y racks', 'Mensual'),
  form('cabinets_racks_annual', 'Gabinetes y racks', 'Anual'),
  form('site_survey', 'Levantamiento', 'Equipo de SCI'),
  form('fire_hose_hydrostatic_test', 'Mangueras contra incendio', 'Prueba hidrostática'),
  form('work_order', 'Orden de trabajo', 'Fábrica y servicios'),
  form('pump_performance_test', 'Prueba de desempeño', 'Sistema de bombeo'),
  form('hydrant_test', 'Prueba de hidrantes', 'Inspección y mantenimiento'),
  form('enclosure_integrity_test', 'Pruebas de integridad a recintos', 'Door-Fan Test'),
  form('water_network_quarterly', 'Red hidráulica', 'Trimestral'),
  form('observations_report', 'Reporte de observaciones'),
  form('sprinklers_weekly', 'Servicio rociadores', 'Semanal'),
  form('sprinklers_monthly', 'Servicio rociadores', 'Mensual'),
  form('sprinklers_annual', 'Servicio rociadores', 'Anual'),
  form('fire_alarm_weekly', 'Sistema de alarmas', 'Semanal'),
  form('fire_alarm_monthly', 'Sistema de alarmas', 'Mensual'),
  form('fire_alarm_annual', 'Sistema de alarmas', 'Anual'),
  form('kitchen_suppression', 'Sistema de supresión de cocina'),
  form('dry_chemical_systems', 'Sistemas de extinción', 'Por químico seco'),
  form('quote_request', 'Solicitud de cotización'),
  form('spark_suppression', 'Supresión de chispa'),
  form('control_valves_weekly', 'Válvulas de control', 'Semanal'),
  form('control_valves_monthly', 'Válvulas de control', 'Mensual'),
  form('control_valves_quarterly', 'Válvulas de control', 'Trimestral'),
  form('control_valves_annual', 'Válvulas de control', 'Anual'),
];
