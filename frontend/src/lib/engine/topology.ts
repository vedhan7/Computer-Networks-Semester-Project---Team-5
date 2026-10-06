export interface TopologyLink {
  id: string;
  source: string;
  target: string;
  capacityMbps: number;
  currentLoadMbps: number;
  isFailed: boolean;
}

export interface FlowRule {
  id: string;
  priority: number;
  match: {
    priorityGroup: number; // W_ac
    room: string;
  };
  action: {
    rateLimitMbps: number;
    queue: string;
  };
  state: 'DORMANT' | 'ACTIVE';
  installedAt: number;
}

export interface TopologyNode {
  id: string;
  type: 'CORE_SWITCH' | 'BUILDING_SWITCH' | 'ROOM_AP';
  label: string;
  isQuarantined: boolean;
  flowTable: FlowRule[];
}

export interface NetworkTopologyState {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export function initializeTopology(): NetworkTopologyState {
  const nodes: TopologyNode[] = [
    { id: 'CORE', type: 'CORE_SWITCH', label: 'Core Switch', isQuarantined: false, flowTable: [] },
    { id: 'SW-ALPHA', type: 'BUILDING_SWITCH', label: 'Alpha Bldg Switch', isQuarantined: false, flowTable: [] },
    { id: 'SW-BETA', type: 'BUILDING_SWITCH', label: 'Beta Bldg Switch', isQuarantined: false, flowTable: [] },
    { id: 'SW-GAMMA', type: 'BUILDING_SWITCH', label: 'Gamma Bldg Switch', isQuarantined: false, flowTable: [] },
  ];

  const links: TopologyLink[] = [
    { id: 'L-CORE-ALPHA', source: 'CORE', target: 'SW-ALPHA', capacityMbps: 10000, currentLoadMbps: 0, isFailed: false },
    { id: 'L-CORE-BETA', source: 'CORE', target: 'SW-BETA', capacityMbps: 10000, currentLoadMbps: 0, isFailed: false },
    { id: 'L-CORE-GAMMA', source: 'CORE', target: 'SW-GAMMA', capacityMbps: 10000, currentLoadMbps: 0, isFailed: false },
  ];

  const buildings = ['Alpha', 'Beta', 'Gamma'];
  
  for (const bldg of buildings) {
    for (let r = 1; r <= 3; r++) {
      const roomId = `${bldg}-${r}01`;
      nodes.push({
        id: roomId,
        type: 'ROOM_AP',
        label: `Room ${roomId}`,
        isQuarantined: false,
        flowTable: []
      });

      links.push({
        id: `L-SW-${bldg.toUpperCase()}-${roomId}`,
        source: `SW-${bldg.toUpperCase()}`,
        target: roomId,
        capacityMbps: 1000,
        currentLoadMbps: 0,
        isFailed: false
      });
    }
  }

  return { nodes, links };
}
