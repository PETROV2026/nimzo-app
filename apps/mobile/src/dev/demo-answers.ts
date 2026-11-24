import type {
  FormDefinition,
  FormField,
  FormNode,
  FormSection,
  FormServiceType,
} from '@nimzo/shared';

type Values = Record<string, unknown>;

const demoText = 'Dato de prueba';
const serviceTypeKey = 'service_type';
const checkPattern = ['ok', 'ok', 'ok', 'ok', 'x', 'ok', 'ok', 'na'] as const;

function demoField(field: FormField, index: number): unknown {
  switch (field.type) {
    case 'text':
      return field.inputMode === 'numeric' || field.inputMode === 'decimal' ? 10 : demoText;
    case 'date':
      return '2026-11-24';
    case 'time':
      return '09:30';
    case 'select':
    case 'choice':
      return field.options[0].value;
    case 'yes_no':
      return index % 4 === 3 ? 'no' : 'yes';
    case 'checkbox':
      return true;
    case 'check': {
      const status = checkPattern[index % checkPattern.length];
      return field.measurement && status !== 'na' ? { status, value: 10 } : { status };
    }
    case 'photos':
    case 'calc':
      return undefined;
  }
}

function demoNodes(nodes: readonly FormNode[]): Values {
  const values: Values = {};
  let index = 0;
  const fill = (list: readonly FormNode[]) => {
    for (const node of list) {
      switch (node.type) {
        case 'group':
          fill(node.children);
          break;
        case 'list':
          values[node.id] = [demoNodes(node.children)];
          break;
        case 'table':
          values[node.id] = Object.fromEntries(
            node.rows.map((row) => [row.id, demoNodes(node.columns)]),
          );
          break;
        case 'note':
        case 'chart':
        case 'observations':
          break;
        default: {
          const value = demoField(node, index);
          index += 1;
          if (value !== undefined) values[node.id] = value;
        }
      }
    }
  };
  fill(nodes);
  return values;
}

function demoSections(sections: readonly FormSection[]) {
  return demoNodes(sections.flatMap((section) => section.children));
}

function demoServiceType(serviceType: FormServiceType | undefined): Values {
  return serviceType ? { [serviceTypeKey]: serviceType.options[0].value } : {};
}

export function demoAnswers(definition: FormDefinition): Values {
  const items = definition.items;
  return {
    ...demoNodes(definition.report),
    ...demoNodes(definition.header ?? []),
    ...demoServiceType(definition.serviceType),
    ...demoSections(definition.sections),
    ...(items
      ? {
          [items.id]: ['1', '2'].map((key) => ({
            ...demoServiceType(items.serviceType),
            ...demoSections(items.sections),
            key,
          })),
        }
      : {}),
    comments: 'Reporte de prueba. No es un servicio real.',
  };
}
