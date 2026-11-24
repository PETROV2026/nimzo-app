import { type FormDefinition, formDefinitionSchema } from '@nimzo/shared';
import cabinetsRacksAnnual from '@nimzo/shared/formatos/cabinets_racks_annual.json';
import cabinetsRacksMonthly from '@nimzo/shared/formatos/cabinets_racks_monthly.json';
import cleanAgentMonthly from '@nimzo/shared/formatos/clean_agent_monthly.json';
import cleanAgentSemiannualAnnual from '@nimzo/shared/formatos/clean_agent_semiannual_annual.json';
import controlValvesAnnual from '@nimzo/shared/formatos/control_valves_annual.json';
import controlValvesMonthly from '@nimzo/shared/formatos/control_valves_monthly.json';
import controlValvesQuarterly from '@nimzo/shared/formatos/control_valves_quarterly.json';
import controlValvesWeekly from '@nimzo/shared/formatos/control_valves_weekly.json';
import dieselPumpAnnual from '@nimzo/shared/formatos/diesel_pump_annual.json';
import dieselPumpMonthly from '@nimzo/shared/formatos/diesel_pump_monthly.json';
import dieselPumpWeekly from '@nimzo/shared/formatos/diesel_pump_weekly.json';
import dryChemicalSystems from '@nimzo/shared/formatos/dry_chemical_systems.json';
import electricPump from '@nimzo/shared/formatos/electric_pump.json';
import enclosureIntegrityTest from '@nimzo/shared/formatos/enclosure_integrity_test.json';
import fireAlarmAnnual from '@nimzo/shared/formatos/fire_alarm_annual.json';
import fireAlarmMonthly from '@nimzo/shared/formatos/fire_alarm_monthly.json';
import fireAlarmWeekly from '@nimzo/shared/formatos/fire_alarm_weekly.json';
import fireHoseHydrostaticTest from '@nimzo/shared/formatos/fire_hose_hydrostatic_test.json';
import hydrantTest from '@nimzo/shared/formatos/hydrant_test.json';
import kitchenSuppression from '@nimzo/shared/formatos/kitchen_suppression.json';
import observationsReport from '@nimzo/shared/formatos/observations_report.json';
import pumpPerformanceTest from '@nimzo/shared/formatos/pump_performance_test.json';
import quoteRequest from '@nimzo/shared/formatos/quote_request.json';
import siteSurvey from '@nimzo/shared/formatos/site_survey.json';
import sparkSuppression from '@nimzo/shared/formatos/spark_suppression.json';
import sprinklersAnnual from '@nimzo/shared/formatos/sprinklers_annual.json';
import sprinklersMonthly from '@nimzo/shared/formatos/sprinklers_monthly.json';
import sprinklersWeekly from '@nimzo/shared/formatos/sprinklers_weekly.json';
import waterNetworkQuarterly from '@nimzo/shared/formatos/water_network_quarterly.json';
import workOrder from '@nimzo/shared/formatos/work_order.json';

const sources: Record<string, unknown> = {
  cabinets_racks_annual: cabinetsRacksAnnual,
  cabinets_racks_monthly: cabinetsRacksMonthly,
  clean_agent_monthly: cleanAgentMonthly,
  clean_agent_semiannual_annual: cleanAgentSemiannualAnnual,
  control_valves_annual: controlValvesAnnual,
  control_valves_monthly: controlValvesMonthly,
  control_valves_quarterly: controlValvesQuarterly,
  control_valves_weekly: controlValvesWeekly,
  diesel_pump_annual: dieselPumpAnnual,
  diesel_pump_monthly: dieselPumpMonthly,
  diesel_pump_weekly: dieselPumpWeekly,
  dry_chemical_systems: dryChemicalSystems,
  electric_pump: electricPump,
  enclosure_integrity_test: enclosureIntegrityTest,
  fire_alarm_annual: fireAlarmAnnual,
  fire_alarm_monthly: fireAlarmMonthly,
  fire_alarm_weekly: fireAlarmWeekly,
  fire_hose_hydrostatic_test: fireHoseHydrostaticTest,
  hydrant_test: hydrantTest,
  kitchen_suppression: kitchenSuppression,
  observations_report: observationsReport,
  pump_performance_test: pumpPerformanceTest,
  quote_request: quoteRequest,
  site_survey: siteSurvey,
  spark_suppression: sparkSuppression,
  sprinklers_annual: sprinklersAnnual,
  sprinklers_monthly: sprinklersMonthly,
  sprinklers_weekly: sprinklersWeekly,
  water_network_quarterly: waterNetworkQuarterly,
  work_order: workOrder,
};

const parsed = new Map<string, FormDefinition>();

export const definitionCodes = Object.keys(sources);

export function getDefinition(code: string): FormDefinition | undefined {
  const cached = parsed.get(code);
  if (cached) return cached;
  const source = sources[code];
  if (source === undefined) return undefined;
  const definition = formDefinitionSchema.parse(source);
  parsed.set(code, definition);
  return definition;
}
