type Choice = { id: string; isActive: boolean };
type ClientChoice = Choice & { name: string };
type BranchChoice = Choice & { clientId: string; name: string };
type SystemChoice = Choice & { branchId: string; name: string };

export type ServiceSelection = {
  clientId?: string | null;
  branchId?: string | null;
  systemId?: string | null;
};

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'es');

export function serviceChoices<
  C extends ClientChoice,
  B extends BranchChoice,
  S extends SystemChoice,
>(clients: C[], branches: B[], systems: S[], selection: ServiceSelection) {
  const activeClients = clients.filter((client) => client.isActive).sort(byName);
  const clientId = activeClients.some((client) => client.id === selection.clientId)
    ? (selection.clientId as string)
    : null;
  const clientBranches = clientId
    ? branches.filter((branch) => branch.isActive && branch.clientId === clientId).sort(byName)
    : [];
  const chosenBranch = clientBranches.find((branch) => branch.id === selection.branchId);
  const branchId = chosenBranch?.id ?? (clientBranches.length === 1 ? clientBranches[0].id : null);
  const branchSystems = branchId
    ? systems.filter((system) => system.isActive && system.branchId === branchId).sort(byName)
    : [];
  const systemId = branchSystems.some((system) => system.id === selection.systemId)
    ? (selection.systemId as string)
    : null;

  return {
    clients: activeClients,
    branches: clientBranches,
    systems: branchSystems,
    clientId,
    branchId,
    systemId,
    ready: Boolean(clientId && branchId),
  };
}
