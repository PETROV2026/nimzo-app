import json, random, sys, uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from generate_demo_catalogs import NOTE, TECHNICIANS, build_catalog, first, last, q

FORMS_DIR = Path(__file__).resolve().parents[2] / 'packages' / 'shared' / 'formatos'
REPORTS_PER_FORM = 3
NAMESPACE = uuid.UUID('4f1c2a7e-0b6d-4c33-9a51-6d2f0e8b7c10')
TODAY = datetime(2026, 10, 26, 18, 0, tzinfo=timezone.utc)

FORM_SYSTEM_TYPES = {
  'F-SER-013': 'fire_pump', 'F-SER-014': 'fire_pump', 'F-SER-015': 'fire_pump', 'F-SER-017': 'hydrant',
  'F-SER-018': 'sprinkler', 'F-SER-023': 'clean_agent', 'F-SER-024': 'clean_agent', 'F-SER-034': 'fire_pump',
  'F-SER-039': 'hydrant', 'F-SER-040': 'clean_agent', 'F-SER-059': 'kitchen_suppression',
  'F-SER-097': 'fire_extinguisher', 'F-SER-098': 'fire_pump', 'F-SER-099': 'other',
  'F-SER-100': 'sprinkler', 'F-SER-101': 'sprinkler', 'F-SER-102': 'sprinkler', 'F-SER-103': 'sprinkler',
  'F-SER-104': 'sprinkler', 'F-SER-105': 'sprinkler', 'F-SER-106': 'sprinkler', 'F-SER-107': 'hydrant',
  'F-SER-108': 'hydrant', 'F-SER-109': 'fire_alarm', 'F-SER-110': 'fire_alarm', 'F-SER-111': 'fire_alarm',
}

TEXT_SAMPLES = [
  (('vta',), lambda rng: f'VTA-{rng.randint(1000, 9999)}'),
  (('nombre', 'responsable', 'supervisor', 'solicitado'), lambda rng: f'{rng.choice(first)} {rng.choice(last)}'),
  (('marca',), lambda rng: rng.choice(['Marca Demo', 'Ejemplo Industrial', 'Prueba Co.'])),
  (('modelo',), lambda rng: f'MD-{rng.randint(100, 999)}'),
  (('serie',), lambda rng: f'SN-DEMO-{rng.randint(10000, 99999)}'),
  (('tiempo',), lambda rng: f'{rng.randint(1, 4)} h'),
  (('área', 'areas', 'áreas', 'ubicación'), lambda rng: rng.choice(['Nave 1', 'Almacén', 'Planta baja', 'Azotea'])),
  (('correo',), lambda rng: f'contacto{rng.randint(1, 99)}@ejemplo.com'),
  (('teléfono',), lambda rng: f'81 0000 {rng.randint(1000, 9999)}'),
]
SENTENCES = [
  'Sin novedades durante la inspección.',
  'Se realizó la limpieza y el equipo quedó operativo.',
  'Se recomienda revisar en la próxima visita.',
  'Dato de ejemplo para pruebas.',
]


def text_value(field, rng):
    if field.get('inputMode') == 'numeric':
        return rng.randint(1, 120)
    if field.get('inputMode') == 'decimal':
        return round(rng.uniform(1, 150), 1)
    label = field['label'].lower()
    for keys, make in TEXT_SAMPLES:
        if any(key in label for key in keys):
            return make(rng)
    return rng.choice(SENTENCES) if field.get('multiline') else 'Dato de ejemplo'


def field_value(field, rng):
    kind = field['type']
    if kind == 'text':
        return text_value(field, rng)
    if kind == 'date':
        return (TODAY - timedelta(days=rng.randint(0, 120))).date().isoformat()
    if kind == 'time':
        return f'{rng.randint(7, 18):02d}:{rng.choice(["00", "15", "30", "45"])}'
    if kind in ('select', 'choice'):
        return rng.choice(field['options'])['value']
    if kind == 'yes_no':
        return rng.choice(['yes', 'yes', 'no'])
    if kind == 'check':
        status = rng.choices(['ok', 'na', 'x'], weights=[80, 10, 10])[0]
        answer = {'status': status}
        if field.get('measurement') and status != 'na':
            answer['value'] = round(rng.uniform(10, 150), 1)
        return answer
    if kind == 'checkbox':
        return rng.random() < 0.4
    if kind == 'photos':
        return []
    return None


def visible(node, answers):
    condition = node.get('visibleWhen')
    return not condition or answers.get(condition['field']) == condition['equals']


def fill(nodes, answers, rng):
    for node in nodes:
        kind = node['type']
        if kind in ('note', 'chart', 'calc') or not visible(node, answers):
            continue
        if kind == 'group':
            fill(node['children'], answers, rng)
        elif kind == 'list':
            entries = []
            for _ in range(rng.randint(1, 3)):
                entry = {}
                fill(node['children'], entry, rng)
                entries.append(entry)
            answers[node['id']] = entries
        elif kind == 'table':
            answers[node['id']] = {
                row['id']: {
                    column['id']: field_value(column, rng)
                    for column in node['columns'] if column['type'] != 'calc'
                }
                for row in node['rows']
            }
        elif kind == 'observations':
            answers[node['id']] = [
                {
                    'system': rng.choice(['Rociadores', 'Hidrantes', 'Bombas', 'Alarmas']),
                    'observation': rng.choice(SENTENCES),
                    'status': rng.choice(['open', 'closed']),
                }
                for _ in range(rng.randint(1, 3))
            ]
        else:
            answers[node['id']] = field_value(node, rng)


def enabled_sections(sections, service_type, answers, rng):
    if not service_type:
        return sections
    option = rng.choice(service_type['options'])
    answers['service_type'] = option['value']
    return [section for section in sections if section['id'] in option['sections']]


def form_answers(form, rng):
    answers = {}
    fill(form['report'], answers, rng)
    fill(form.get('header', []), answers, rng)
    items = form.get('items')
    if items:
        sections = enabled_sections(items['sections'], form.get('serviceType'), answers, rng)
        entries = []
        for n in range(1, rng.randint(1, 3) + 1):
            entry = {'key': str(n)}
            item_sections = enabled_sections(sections, items.get('serviceType'), entry, rng)
            for section in item_sections:
                fill(section['children'], entry, rng)
            entries.append(entry)
        answers[items['id']] = entries
    else:
        for section in enabled_sections(form['sections'], form.get('serviceType'), answers, rng):
            fill(section['children'], answers, rng)
    if rng.random() < 0.5:
        answers['comments'] = rng.choice(SENTENCES)
    return answers


def report_rows():
    rng = random.Random(2026)
    branches = {
        t['email']: [
            (client['name'], branch['name'], {s['system_type'] for s in branch['systems'] if s['is_active']})
            for client in build_catalog(t) if client['is_active']
            for branch in client['branches'] if branch['is_active']
        ]
        for t in TECHNICIANS
    }
    emails = [t['email'] for t in TECHNICIANS]
    rows = []
    for path in sorted(FORMS_DIR.glob('F-SER-*.json')):
        form = json.loads(path.read_text())
        system_type = FORM_SYSTEM_TYPES.get(form['code'])
        for n in range(REPORTS_PER_FORM):
            order = [emails[(len(rows) + k) % len(emails)] for k in range(len(emails))]
            email = next((e for e in order if any(system_type in b[2] for b in branches[e])), order[0])
            candidates = [b for b in branches[email] if system_type in b[2]] or branches[email]
            client_name, branch_name, _ = rng.choice(candidates)
            signed = TODAY - timedelta(days=rng.randint(1, 120), hours=rng.randint(0, 8))
            started = signed - timedelta(hours=rng.randint(1, 4), minutes=rng.randint(0, 59))
            sent = signed + timedelta(hours=rng.choice([0, 0, 1, 20, 48]), minutes=rng.randint(1, 30))
            rows.append({
                'technician_email': email,
                'client_name': client_name,
                'branch_name': branch_name,
                'system_type': system_type,
                'form_code': form['code'],
                'form_version': form['version'],
                'id': str(uuid.uuid5(NAMESPACE, f"{form['code']}-{n}")),
                'answers': json.dumps(form_answers(form, rng), ensure_ascii=False, separators=(',', ':')),
                'supervisor_name': f'{rng.choice(first)} {rng.choice(last)}',
                'started_at': started.isoformat(),
                'signed_at': signed.isoformat(),
                'sent_at': sent.isoformat(),
            })
    return rows


def main(path):
    rows = report_rows()
    columns = list(rows[0])
    values = (',' + chr(10) + '    ').join('(' + ', '.join(q(row[c]) for c in columns) + ')' for row in rows)
    sql = f"""/*
 * Demo reports: {REPORTS_PER_FORM} sent reports for each of the {len(rows) // REPORTS_PER_FORM} service forms, spread over the demo
 * technicians and their demo clients. Load supabase/seeds/demo-catalogs.sql first. Reports of a
 * demo technician whose account does not exist are skipped. Running it again inserts nothing new.
 *
 * Answers are filled from packages/shared/formatos with fake values, keyed by field id. Photo and
 * signature paths point to files that are not uploaded. Every report has "demo": true in its
 * snapshot, so supabase/seeds/remove-demo-catalogs.sql can remove it.
 *
 *   pnpm supabase db query --linked -f supabase/seeds/demo-reports.sql
 *
 * Generated by supabase/seeds/generate_demo_reports.py.
 */

with report_data ({', '.join(columns)}) as (
  values
    {values}
),
resolved as (
  select r.*, p.id as technician_id, c.id as client_id, b.id as branch_id, s.id as system_id,
         f.id as service_form_id, to_jsonb(c) as client, to_jsonb(b) as branch, to_jsonb(s) as system
  from report_data r
  join public.profiles p on p.email = r.technician_email and p.role = 'technician' and p.is_active
  join public.clients c on c.technician_id = p.id and c.name = r.client_name and c.notes = '{NOTE}'
  join public.branches b on b.client_id = c.id and b.name = r.branch_name
  join public.service_forms f on f.code = r.form_code
  left join lateral (
    select * from public.systems
    where branch_id = b.id and system_type::text = r.system_type
    order by is_active desc, name
    limit 1
  ) s on true
),
inserted as (
  insert into public.reports (
    id, technician_id, client_id, branch_id, system_id, service_form_id, form_code, form_version,
    answers, snapshot, supervisor_name, supervisor_signature_path, technician_signature_path,
    started_at, signed_at, sent_at
  )
  select
    id::uuid, technician_id, client_id, branch_id, system_id, service_form_id, form_code, form_version::int,
    answers::jsonb,
    jsonb_build_object(
      'demo', true,
      'client', client - 'search_text' - 'technician_id',
      'branch', branch - 'search_text' - 'technician_id',
      'system', case when system is null then null else system - 'search_text' - 'technician_id' end
    ),
    supervisor_name,
    technician_id::text || '/' || id || '/supervisor.png',
    technician_id::text || '/' || id || '/technician.png',
    started_at::timestamptz, signed_at::timestamptz, sent_at::timestamptz
  from resolved
  on conflict (id) do nothing
  returning form_code
)
select count(*) as reports, count(distinct form_code) as forms from inserted;
"""
    open(path, 'w').write(sql)
    print(len(rows), 'reports')


if __name__ == '__main__':
    main(sys.argv[1])
