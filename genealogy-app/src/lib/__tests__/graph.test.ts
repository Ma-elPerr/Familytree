import { buildGraph } from '../graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from '../parsers';

describe('buildGraph', () => {
  const createIndividual = (id: string, name: string): GedcomIndividual => ({
    id,
    name,
    givenName: name.split(' ')[0],
    surname: name.split(' ')[1] || '',
  });

  const createFamily = (id: string, husband?: string, wife?: string, children: string[] = []): GedcomFamily => ({
    id,
    husband,
    wife,
    children
  });

  it('should create an empty graph for empty data', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map()
    };
    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should initialize nodes for individuals without families', () => {
    const i1 = createIndividual('I1', 'John Doe');
    const data: GedcomData = {
      individuals: new Map([['I1', i1]]),
      families: new Map()
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(1);

    const node = graph.get('I1');
    expect(node).toBeDefined();
    expect(node?.individual).toEqual(i1);
    expect(node?.parents).toEqual([]);
    expect(node?.children).toEqual([]);
    expect(node?.spouses).toEqual([]);
  });

  it('should correctly link spouses, parents, and children for a standard family', () => {
    const i1 = createIndividual('I1', 'Husband Doe');
    const i2 = createIndividual('I2', 'Wife Doe');
    const i3 = createIndividual('I3', 'Child1 Doe');
    const i4 = createIndividual('I4', 'Child2 Doe');

    const f1 = createFamily('F1', 'I1', 'I2', ['I3', 'I4']);

    const data: GedcomData = {
      individuals: new Map([['I1', i1], ['I2', i2], ['I3', i3], ['I4', i4]]),
      families: new Map([['F1', f1]])
    };

    const graph = buildGraph(data);

    // Check Husband
    const hNode = graph.get('I1');
    expect(hNode?.spouses).toEqual(['I2']);
    expect(hNode?.children).toEqual(['I3', 'I4']);
    expect(hNode?.parents).toEqual([]);

    // Check Wife
    const wNode = graph.get('I2');
    expect(wNode?.spouses).toEqual(['I1']);
    expect(wNode?.children).toEqual(['I3', 'I4']);
    expect(wNode?.parents).toEqual([]);

    // Check Child1
    const c1Node = graph.get('I3');
    expect(c1Node?.parents).toEqual(['I1', 'I2']);
    expect(c1Node?.spouses).toEqual([]);
    expect(c1Node?.children).toEqual([]);

    // Check Child2
    const c2Node = graph.get('I4');
    expect(c2Node?.parents).toEqual(['I1', 'I2']);
    expect(c2Node?.spouses).toEqual([]);
    expect(c2Node?.children).toEqual([]);
  });

  it('should correctly link families with a single parent', () => {
    const i1 = createIndividual('I1', 'Single Mother');
    const i2 = createIndividual('I2', 'Child');

    // Husband is missing
    const f1 = createFamily('F1', undefined, 'I1', ['I2']);

    const data: GedcomData = {
      individuals: new Map([['I1', i1], ['I2', i2]]),
      families: new Map([['F1', f1]])
    };

    const graph = buildGraph(data);

    const mNode = graph.get('I1');
    expect(mNode?.spouses).toEqual([]);
    expect(mNode?.children).toEqual(['I2']);

    const cNode = graph.get('I2');
    expect(cNode?.parents).toEqual(['I1']);
  });

  it('should deduplicate edges if data has redundant references', () => {
    const i1 = createIndividual('I1', 'Husband');
    const i2 = createIndividual('I2', 'Wife');
    const i3 = createIndividual('I3', 'Child');

    // Duplicate children references in same family
    const f1 = createFamily('F1', 'I1', 'I2', ['I3', 'I3']);

    // Redundant family representing the same connection
    const f2 = createFamily('F2', 'I1', 'I2', ['I3']);

    const data: GedcomData = {
      individuals: new Map([['I1', i1], ['I2', i2], ['I3', i3]]),
      families: new Map([['F1', f1], ['F2', f2]])
    };

    const graph = buildGraph(data);

    const hNode = graph.get('I1');
    expect(hNode?.spouses).toEqual(['I2']); // Only one spouse reference
    expect(hNode?.children).toEqual(['I3']); // Only one child reference

    const wNode = graph.get('I2');
    expect(wNode?.spouses).toEqual(['I1']);
    expect(wNode?.children).toEqual(['I3']);

    const cNode = graph.get('I3');
    expect(cNode?.parents).toEqual(['I1', 'I2']); // Only one set of parents
  });

  it('should not throw if families reference missing individuals', () => {
    const i3 = createIndividual('I3', 'Child');

    // References I1 and I2, which are not in individuals map
    const f1 = createFamily('F1', 'I1', 'I2', ['I3']);

    const data: GedcomData = {
      individuals: new Map([['I3', i3]]),
      families: new Map([['F1', f1]])
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(1);

    const cNode = graph.get('I3');
    // The child exists and parents are added to its array,
    // even though parent nodes themselves don't exist in the graph.
    // The implementation pushes to existing children arrays.
    expect(cNode?.parents).toEqual(['I1', 'I2']);

    // graph.get('I1') and graph.get('I2') are undefined,
    // so no children are added to them.
    expect(graph.get('I1')).toBeUndefined();
    expect(graph.get('I2')).toBeUndefined();
  });
});
