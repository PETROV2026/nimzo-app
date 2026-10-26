import random, sys, unicodedata

clients = [
  'Aceros del Valle', 'Plásticos Regios', 'Logística Cumbres', 'Hotel Paseo Real', 'Hospital San Rafael',
  'Alimentos La Sierra', 'Textiles del Bajío', 'Centro Comercial Las Fuentes', 'Química Industrial Norte', 'Bodegas El Puerto',
  'Universidad Tecnológica Sur', 'Automotriz Cerro Alto', 'Papelera Monterrey', 'Farmacéutica Lumen', 'Embotelladora Río Claro',
  'Torre Corporativa Arcos', 'Vidrios y Cristales Omega', 'Cinemas Estrella', 'Data Center Nube Azul', 'Restaurantes Sabor Norteño',
  'Muebles Roble Fino', 'Laboratorios Vitalis', 'Parque Industrial Las Palmas', 'Colegio Monte Verde', 'Distribuidora Ferretera Faro',
]
first = ['Laura', 'Carlos', 'Ana', 'Jorge', 'María', 'Luis', 'Sofía', 'Ricardo', 'Elena', 'Miguel', 'Paola', 'Daniel']
last = ['Ejemplo', 'Prueba', 'Demo', 'Muestra', 'Ficticio']
cities = [('Monterrey', 'NLE'), ('Apodaca', 'NLE'), ('San Nicolás', 'NLE'), ('Guadalupe', 'NLE'), ('Saltillo', 'COA'),
          ('Torreón', 'COA'), ('Ciudad de México', 'CMX'), ('Toluca', 'MEX'), ('Querétaro', 'QUE'), ('Guadalajara', 'JAL'),
          ('Zapopan', 'JAL'), ('León', 'GUA'), ('Puebla', 'PUE'), ('Chihuahua', 'CHH'), ('Hermosillo', 'SON'),
          ('Mérida', 'YUC'), ('San Luis Potosí', 'SLP'), ('Aguascalientes', 'AGU'), ('Tijuana', 'BCN'), ('Veracruz', 'VER')]
branch_kinds = ['Planta', 'Bodega', 'Sucursal', 'Centro de distribución', 'Oficinas', 'Nave']
zones = ['Norte', 'Sur', 'Centro', 'Oriente', 'Poniente', 'Industrial', 'Aeropuerto']
system_names = {
  'sprinkler': ['Red de rociadores nave {n}', 'Rociadores área de almacén', 'Rociadores oficinas'],
  'hydrant': ['Red de hidrantes perimetral', 'Hidrantes patio de maniobras'],
  'fire_pump': ['Cuarto de bombas', 'Bomba jockey y principal'],
  'fire_extinguisher': ['Extintores planta baja', 'Extintores nivel {n}', 'Extintores área de producción'],
  'fire_alarm': ['Panel de detección y alarma', 'Detectores de humo oficinas'],
  'kitchen_suppression': ['Supresión campana de cocina'],
  'clean_agent': ['Agente limpio cuarto de servidores'],
  'other': ['Puertas cortafuego'],
}
locations = ['Nave 1', 'Nave 2', 'Planta baja', 'Azotea', 'Cuarto de máquinas', 'Exterior norte', 'Almacén', 'Sótano', None]
NOTE = 'Datos de ejemplo'

TECHNICIANS = [
  {'email': 'tecnico.demo@ejemplo.com', 'seed': 25, 'first_index': 1, 'clients': clients},
  {'email': 'tecnico.demo2@ejemplo.com', 'seed': 26, 'first_index': 31, 'clients': [
    clients[0], clients[4], clients[12], 'Cervecería Valle Alto', 'Clínica Santa Fe',
    'Almacenes del Norte', 'Hotel Bahía Azul', 'Planta Ensambladora Delta',
  ]},
  {'email': 'tecnico.demo3@ejemplo.com', 'seed': 27, 'first_index': 51, 'clients': [
    clients[1], clients[9], 'Centro Logístico Oriente', 'Panificadora Trigo Dorado',
    'Escuela Primaria Ejemplo', 'Torre Médica Sur',
  ]},
]


def plain(name):
    return unicodedata.normalize('NFKD', name.split()[0].lower()).encode('ascii', 'ignore').decode()


def build_catalog(technician):
    rng = random.Random(technician['seed'])
    catalog = []
    for offset, base in enumerate(technician['clients']):
        i = technician['first_index'] + offset
        person = f'{rng.choice(first)} {rng.choice(last)}'
        client = {
            'name': f'{base} (demo)',
            'tax_id': f'DEM0101{i:02d}D{i:02d}' if i % 4 != 0 else None,
            'contact_name': person if i % 6 else None,
            'contact_email': f'{plain(person)}{i}@ejemplo.com' if i % 3 else None,
            'contact_phone': f'81 0000 {i:04d}' if i % 5 else None,
            'is_active': i not in (7, 19),
            'branches': [],
        }
        used = set()
        for b in range(rng.randint(1, 3)):
            while True:
                city, state = rng.choice(cities)
                bname = f'{rng.choice(branch_kinds)} {rng.choice(zones)}'
                if bname not in used:
                    used.add(bname); break
            address = f'Av. Ejemplo {rng.randint(100, 999)}, Col. Demo' if rng.random() > 0.2 else None
            contact = f'{rng.choice(first)} {rng.choice(last)}' if rng.random() > 0.3 else None
            phone = f'81 0000 {rng.randint(1000, 9999)}' if contact else None
            email = f'{plain(contact)}.{i}{b}@ejemplo.com' if contact and rng.random() > 0.3 else None
            branch = {
                'name': bname, 'address': address, 'city': city, 'state': state, 'contact_name': contact,
                'contact_email': email, 'contact_phone': phone,
                'is_active': not (client['is_active'] and rng.random() < 0.1), 'systems': [],
            }
            for system_type in rng.sample(list(system_names), rng.randint(1, 4)):
                branch['systems'].append({
                    'system_type': system_type,
                    'name': rng.choice(system_names[system_type]).format(n=rng.randint(1, 3)),
                    'location': rng.choice(locations),
                    'is_active': rng.random() > 0.08,
                })
            client['branches'].append(branch)
        catalog.append(client)
    return catalog


def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return str(v).lower()
    return "'" + str(v).replace("'", "''") + "'"


def rows(values):
    return (',' + chr(10) + '    ').join(values)


def technician_sql(technician):
    catalog = build_catalog(technician)
    client_rows = [
        f"({q(c['name'])}, {q(c['tax_id'])}, {q(c['contact_name'])}, {q(c['contact_email'])}, {q(c['contact_phone'])}, {q(NOTE)}, {q(c['is_active'])})"
        for c in catalog
    ]
    branch_rows = [
        f"({q(c['name'])}, {q(b['name'])}, {q(b['address'])}, {q(b['city'])}, {q(b['state'])}, {q(b['contact_name'])}, {q(b['contact_email'])}, {q(b['contact_phone'])}, {q(b['is_active'])})"
        for c in catalog for b in c['branches']
    ]
    system_rows = [
        f"({q(c['name'])}, {q(b['name'])}, {q(s['system_type'])}, {q(s['name'])}, {q(s['location'])}, {q(s['is_active'])})"
        for c in catalog for b in c['branches'] for s in b['systems']
    ]
    email = technician['email']
    return f"""with owner as (
  select id from public.profiles where email = '{email}' and role = 'technician' and is_active
),
client_data (name, tax_id, contact_name, contact_email, contact_phone, notes, is_active) as (
  values
    {rows(client_rows)}
),
new_clients as (
  insert into public.clients (technician_id, name, tax_id, contact_name, contact_email, contact_phone, notes, is_active)
  select o.id, d.name, d.tax_id, d.contact_name, d.contact_email, d.contact_phone, d.notes, d.is_active
  from client_data d cross join owner o
  where not exists (select 1 from public.clients where technician_id = o.id and notes = '{NOTE}')
  returning id, name
),
branch_data (client_name, name, address, city, state, contact_name, contact_email, contact_phone, is_active) as (
  values
    {rows(branch_rows)}
),
new_branches as (
  insert into public.branches (client_id, name, address, city, state, contact_name, contact_email, contact_phone, is_active)
  select c.id, b.name, b.address, b.city, b.state, b.contact_name, b.contact_email, b.contact_phone, b.is_active
  from branch_data b join new_clients c on c.name = b.client_name
  returning id, client_id, name
),
system_data (client_name, branch_name, system_type, name, location, is_active) as (
  values
    {rows(system_rows)}
),
new_systems as (
  insert into public.systems (branch_id, system_type, name, location, is_active)
  select nb.id, s.system_type::public.system_type, s.name, s.location, s.is_active
  from system_data s
  join new_clients c on c.name = s.client_name
  join new_branches nb on nb.client_id = c.id and nb.name = s.branch_name
  returning id
)
select '{email}' as technician,
       (select count(*) from new_clients) as clients,
       (select count(*) from new_branches) as branches,
       (select count(*) from new_systems) as systems;
"""


def main(path):
    main_email = TECHNICIANS[0]['email']
    others = ' and '.join(t['email'] for t in TECHNICIANS[1:])
    sql = f"""/*
 * Demo catalogs: clients with their branches and fire protection systems for the demo technicians.
 * {main_email} is required; {others} are optional and get their own clients
 * when their accounts exist. Create the accounts in the admin panel first.
 *
 * Every row is clearly fake: names end in "(demo)", emails use ejemplo.com, phones use 0000,
 * and every client has notes = '{NOTE}'. Running it again only loads technicians that have no demo
 * clients yet.
 *
 *   pnpm supabase db query --linked -f supabase/seeds/demo-catalogs.sql
 *
 * Remove the data with supabase/seeds/remove-demo-catalogs.sql.
 * Generated by supabase/seeds/generate_demo_catalogs.py.
 */

do $$
begin
  if not exists (
    select 1 from public.profiles
    where email = '{main_email}' and role = 'technician' and is_active
  ) then
    raise exception 'Create the demo technician {main_email} in the panel first.';
  end if;
end;
$$;

""" + '\n'.join(technician_sql(t) for t in TECHNICIANS)
    open(path, 'w').write(sql)
    for t in TECHNICIANS:
        catalog = build_catalog(t)
        branches = sum(len(c['branches']) for c in catalog)
        systems = sum(len(b['systems']) for c in catalog for b in c['branches'])
        print(t['email'], len(catalog), 'clients', branches, 'branches', systems, 'systems')


if __name__ == '__main__':
    main(sys.argv[1])
