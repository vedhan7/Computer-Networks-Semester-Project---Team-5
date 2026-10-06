import { describe, it, expect } from 'vitest';
import { initializeTopology } from '../topology';

describe('Network Topology Engine', () => {
  it('initializes the correct number of nodes and links', () => {
    const { nodes, links } = initializeTopology();
    
    // Core (1) + Building Switches (3) + Rooms (9) = 13 nodes
    expect(nodes.length).toBe(13);
    
    // Core to Buildings (3) + Buildings to Rooms (9) = 12 links
    expect(links.length).toBe(12);
  });

  it('contains the CORE node', () => {
    const { nodes } = initializeTopology();
    const core = nodes.find(n => n.id === 'CORE');
    expect(core).toBeDefined();
    expect(core?.type).toBe('CORE_SWITCH');
  });

  it('contains room APs', () => {
    const { nodes } = initializeTopology();
    const rooms = nodes.filter(n => n.type === 'ROOM_AP');
    expect(rooms.length).toBe(9);
    expect(rooms[0].id).toBe('Alpha-101');
  });
});
