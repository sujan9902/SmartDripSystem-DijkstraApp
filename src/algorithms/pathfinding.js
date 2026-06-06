// Custom Pathfinding Algorithms Module with Step-by-Step Recording

// Weight presets from UI
export const PIPE_PRESETS = {
  mainline: { label: '4" PVC Main Trunk Line', friction: 0.04, maxFlowCap: 700, costPerMeter: 9.20, color: '#22d3ee' },
  submain: { label: '2" Poly Distribution Pipe', friction: 0.15, maxFlowCap: 250, costPerMeter: 4.80, color: '#a855f7' },
  lateral: { label: '0.5" Micro-Emitter Line', friction: 0.70, maxFlowCap: 40, costPerMeter: 1.25, color: '#f59e0b' }
};

// Calculate weights based on node types, altitude delta, and distance
export const getEdgeWeight = (fromNode, toNode, edge, mode, scaleMultiplier) => {
  if (mode === 'manual') {
    return Number(edge.weight) || 1;
  }
  
  const dist = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) * scaleMultiplier;
  
  if (mode === 'euclidean') {
    return Math.round(dist);
  }
  
  // Custom formula (hydraulic formula)
  const pipeType = edge.pipeType || 'mainline';
  const friction = PIPE_PRESETS[pipeType]?.friction || 0.1;
  
  const zDelta = toNode.z - fromNode.z;
  const elevationCost = zDelta > 0 ? (zDelta * 3.0) : (Math.abs(zDelta) * 0.2);
  
  // weight = (distance * friction * 0.05) + elevation resistance
  return parseFloat(((dist * friction * 0.05) + elevationCost).toFixed(2));
};

// Build standard adjacency list representation from graph topology
export const buildAdjacencyList = (nodes, edges, weightMode, scaleMultiplier) => {
  const adj = {};
  nodes.forEach(n => {
    adj[n.id] = [];
  });

  edges.forEach(e => {
    const fromNode = nodes.find(n => n.id === e.from);
    const toNode = nodes.find(n => n.id === e.to);
    
    // Ignore edges with missing nodes, or if nodes are blocked/walls
    if (!fromNode || !toNode) return;
    if (fromNode.type === 'wall' || toNode.type === 'wall') return;
    
    const weightForward = getEdgeWeight(fromNode, toNode, e, weightMode, scaleMultiplier);
    adj[e.from].push({
      nodeId: e.to,
      edgeId: e.id,
      weight: weightForward,
      directed: !!e.directed
    });
    
    // If undirected, add reverse link
    if (!e.directed) {
      const weightBackward = getEdgeWeight(toNode, fromNode, e, weightMode, scaleMultiplier);
      adj[e.to].push({
        nodeId: e.from,
        edgeId: e.id,
        weight: weightBackward,
        directed: false
      });
    }
  });
  
  return adj;
};

// --- DIJKSTRA ---
export const DIJKSTRA_PSEUDOCODE = [
  "Initialize dist[v] = Infinity for all v, dist[source] = 0",
  "Insert all nodes into Priority Queue Q",
  "while Q is not empty:",
  "  u = Q.extractMin() // node with minimum dist",
  "  if u == destination: stop search",
  "  for each neighbor v of u:",
  "    alt = dist[u] + weight(u, v)",
  "    if alt < dist[v]:",
  "      dist[v] = alt, parent[v] = u",
  "      Q.decreasePriority(v, alt)"
];

export const runDijkstraSteps = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const adj = buildAdjacencyList(nodes, edges, weightMode, scaleMultiplier);
  const steps = [];
  const distances = {};
  const parents = {};
  const visited = new Set();
  
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  distances[sourceId] = 0;
  
  let queue = [{ nodeId: sourceId, priority: 0 }];
  
  steps.push({
    currentNodeId: null,
    visited: [],
    distances: { ...distances },
    parents: { ...parents },
    queue: [...queue],
    highlightedEdgeId: null,
    action: `Initialize source ${sourceId} to 0, all other nodes to Infinity.`,
    explanation: `We set the source node's distance to 0 since we begin our search there. All other node distances are initialized to Infinity as they are currently unexplored and unreachable.`,
    codeLine: 0,
    type: 'init'
  });

  let relaxationCount = 0;

  while (queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const current = queue.shift();
    const currId = current.nodeId;
    const currDist = current.priority;
    
    if (visited.has(currId)) continue;
    visited.add(currId);
    
    steps.push({
      currentNodeId: currId,
      visited: Array.from(visited),
      distances: { ...distances },
      parents: { ...parents },
      queue: [...queue],
      highlightedEdgeId: null,
      action: `Select node ${currId} with min tentative distance ${currDist.toFixed(2)}.`,
      explanation: `From our frontier of candidate nodes, we select node ${currId} because it has the absolute smallest tentative distance (${currDist.toFixed(2)}). Its distance is now finalized.`,
      codeLine: 3,
      type: 'extract'
    });
    
    if (destId && currId === destId) {
      steps.push({
        currentNodeId: currId,
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        queue: [...queue],
        highlightedEdgeId: null,
        action: `Reached destination node ${destId}!`,
        explanation: `The destination node ${destId} has been selected. The shortest path is found. We stop the search.`,
        codeLine: 4,
        type: 'done',
        relaxationCount
      });
      return steps;
    }
    
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.nodeId;
      if (visited.has(neighborId)) continue;
      
      const alt = currDist + edge.weight;
      const currentNeighborDist = distances[neighborId];
      
      if (alt < currentNeighborDist) {
        relaxationCount++;
        distances[neighborId] = alt;
        parents[neighborId] = { nodeId: currId, edgeId: edge.edgeId };
        
        // Add or update priority queue
        const existingIdx = queue.findIndex(q => q.nodeId === neighborId);
        if (existingIdx !== -1) {
          queue[existingIdx].priority = alt;
        } else {
          queue.push({ nodeId: neighborId, priority: alt });
        }
        
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          queue: [...queue],
          highlightedEdgeId: edge.edgeId,
          action: `Relax edge ${currId} ➔ ${neighborId}: updated distance to ${alt.toFixed(2)}.`,
          explanation: `Exploring node ${neighborId} via ${currId}. The path cost (${currDist.toFixed(2)} + ${edge.weight.toFixed(2)} = ${alt.toFixed(2)}) is shorter than ${currentNeighborDist === Infinity ? 'Infinity' : currentNeighborDist.toFixed(2)}. We update the distance and set ${currId} as its parent.`,
          codeLine: 8,
          type: 'relax-success'
        });
      } else {
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          queue: [...queue],
          highlightedEdgeId: edge.edgeId,
          action: `Skip edge ${currId} ➔ ${neighborId}: path through ${currId} (${alt.toFixed(2)}) is not shorter than current (${currentNeighborDist.toFixed(2)}).`,
          explanation: `Evaluating path to node ${neighborId} via ${currId}. The path cost (${alt.toFixed(2)}) is not an improvement over its current known distance of ${currentNeighborDist.toFixed(2)}. We skip updating this neighbor.`,
          codeLine: 7,
          type: 'relax-skip'
        });
      }
    }
  }
  
  const destReached = destId ? visited.has(destId) : true;
  steps.push({
    currentNodeId: null,
    visited: Array.from(visited),
    distances: { ...distances },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: destReached ? "Dijkstra search complete!" : `Destination node ${destId} is unreachable.`,
    explanation: destReached 
      ? "All reachable nodes have been successfully resolved. Search complete." 
      : `No path exists from source ${sourceId} to destination ${destId} through the active network graph.`,
    codeLine: 2,
    type: destReached ? 'done' : 'unreachable',
    relaxationCount
  });
  
  return steps;
};

// --- A* SEARCH ---
export const ASTAR_PSEUDOCODE = [
  "Initialize gScore[v] = Infinity, fScore[v] = Infinity, gScore[source] = 0, fScore[source] = h(source)",
  "Insert source into Priority Queue Q sorted by fScore",
  "while Q is not empty:",
  "  u = Q.extractMin() // node with lowest fScore",
  "  if u == destination: stop search",
  "  for each neighbor v of u:",
  "    tentative_g = gScore[u] + weight(u, v)",
  "    if tentative_g < gScore[v]:",
  "      gScore[v] = tentative_g, parent[v] = u",
  "      fScore[v] = tentative_g + h(v)",
  "      Q.insertOrUpdate(v, fScore[v])"
];

export const runAStarSteps = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const adj = buildAdjacencyList(nodes, edges, weightMode, scaleMultiplier);
  const steps = [];
  const gScores = {};
  const fScores = {};
  const parents = {};
  const visited = new Set();
  
  const destNode = nodes.find(n => n.id === destId);
  const getHeuristic = (nodeId) => {
    if (!destNode) return 0;
    const n = nodes.find(item => item.id === nodeId);
    if (!n) return 0;
    // Euclidean heuristic
    return Math.round(Math.hypot(destNode.x - n.x, destNode.y - n.y) * scaleMultiplier);
  };
  
  nodes.forEach(n => {
    gScores[n.id] = Infinity;
    fScores[n.id] = Infinity;
    parents[n.id] = null;
  });
  
  gScores[sourceId] = 0;
  fScores[sourceId] = getHeuristic(sourceId);
  
  let queue = [{ nodeId: sourceId, priority: fScores[sourceId], g: 0 }];
  
  steps.push({
    currentNodeId: null,
    visited: [],
    distances: { ...gScores },
    fScores: { ...fScores },
    parents: { ...parents },
    queue: [...queue],
    highlightedEdgeId: null,
    action: `Set g[source]=0 and f[source]=h(source)=${fScores[sourceId]}.`,
    explanation: `For A*, we estimate the remaining distance to target. The source's actual cost (gScore) is 0, and its total estimated cost (fScore) is its heuristic distance h(source) = ${fScores[sourceId]}.`,
    codeLine: 0,
    type: 'init'
  });

  let relaxationCount = 0;

  while (queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const current = queue.shift();
    const currId = current.nodeId;
    const currG = gScores[currId];
    
    if (visited.has(currId)) continue;
    visited.add(currId);
    
    steps.push({
      currentNodeId: currId,
      visited: Array.from(visited),
      distances: { ...gScores },
      fScores: { ...fScores },
      parents: { ...parents },
      queue: [...queue],
      highlightedEdgeId: null,
      action: `Select node ${currId} with min fScore = ${fScores[currId].toFixed(2)}.`,
      explanation: `We extract node ${currId} from priority queue, which has the lowest estimated total distance f(n) = ${fScores[currId].toFixed(2)} (gScore: ${currG.toFixed(2)} + heuristic: ${getHeuristic(currId).toFixed(2)}).`,
      codeLine: 3,
      type: 'extract'
    });
    
    if (destId && currId === destId) {
      steps.push({
        currentNodeId: currId,
        visited: Array.from(visited),
        distances: { ...gScores },
        fScores: { ...fScores },
        parents: { ...parents },
        queue: [...queue],
        highlightedEdgeId: null,
        action: `Reached destination node ${destId}!`,
        explanation: `The target node ${destId} has been extracted. A* guarantees the shortest path is found since our heuristic is admissible (Euclidean distance is straight-line and never overestimates).`,
        codeLine: 4,
        type: 'done',
        relaxationCount
      });
      return steps;
    }
    
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.nodeId;
      if (visited.has(neighborId)) continue;
      
      const tentativeG = currG + edge.weight;
      const currentNeighborG = gScores[neighborId];
      
      if (tentativeG < currentNeighborG) {
        relaxationCount++;
        gScores[neighborId] = tentativeG;
        const h = getHeuristic(neighborId);
        fScores[neighborId] = tentativeG + h;
        parents[neighborId] = { nodeId: currId, edgeId: edge.edgeId };
        
        const existingIdx = queue.findIndex(q => q.nodeId === neighborId);
        if (existingIdx !== -1) {
          queue[existingIdx].priority = tentativeG + h;
        } else {
          queue.push({ nodeId: neighborId, priority: tentativeG + h });
        }
        
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...gScores },
          fScores: { ...fScores },
          parents: { ...parents },
          queue: [...queue],
          highlightedEdgeId: edge.edgeId,
          action: `Relax edge ${currId} ➔ ${neighborId}: updated g=${tentativeG.toFixed(2)}, f=${(tentativeG + h).toFixed(2)}.`,
          explanation: `We relaxed this edge. The new path cost from source to ${neighborId} is gScore = ${tentativeG.toFixed(2)}. Adding heuristic h(n) = ${h.toFixed(2)}, we get fScore = ${(tentativeG + h).toFixed(2)}, improving on the previous fScore of ${currentNeighborG === Infinity ? 'Infinity' : (currentNeighborG + h).toFixed(2)}.`,
          codeLine: 10,
          type: 'relax-success'
        });
      } else {
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...gScores },
          fScores: { ...fScores },
          parents: { ...parents },
          queue: [...queue],
          highlightedEdgeId: edge.edgeId,
          action: `Skip edge ${currId} ➔ ${neighborId}: path gScore (${tentativeG.toFixed(2)}) is not shorter than current gScore (${currentNeighborG.toFixed(2)}).`,
          explanation: `We skip this edge. Moving through ${currId} to ${neighborId} costs gScore = ${tentativeG.toFixed(2)}, which is not better than its existing gScore of ${currentNeighborG.toFixed(2)}.`,
          codeLine: 7,
          type: 'relax-skip'
        });
      }
    }
  }
  
  const destReached = destId ? visited.has(destId) : true;
  steps.push({
    currentNodeId: null,
    visited: Array.from(visited),
    distances: { ...gScores },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: destReached ? "A* search complete!" : `Destination node ${destId} is unreachable.`,
    explanation: destReached 
      ? "A* pathfinding traversal finished successfully." 
      : `No path exists to destination ${destId}.`,
    codeLine: 2,
    type: destReached ? 'done' : 'unreachable',
    relaxationCount
  });
  
  return steps;
};

// --- BELLMAN-FORD ---
export const BELLMAN_FORD_PSEUDOCODE = [
  "Initialize dist[v] = Infinity for all v, dist[source] = 0",
  "for i from 1 to |V| - 1:",
  "  for each edge (u, v) in graph:",
  "    if dist[u] + weight(u, v) < dist[v]:",
  "      dist[v] = dist[u] + weight(u, v)",
  "      parent[v] = u",
  "for each edge (u, v) in graph:",
  "  if dist[u] + weight(u, v) < dist[v]:",
  "    Error: Graph contains a negative-weight cycle"
];

export const runBellmanFordSteps = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const steps = [];
  const distances = {};
  const parents = {};
  
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  distances[sourceId] = 0;
  
  steps.push({
    currentNodeId: null,
    visited: [],
    distances: { ...distances },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: `Initialize source ${sourceId} to 0, other nodes to Infinity.`,
    explanation: `Setting source distance to 0. Bellman-Ford runs |V|-1 iterations over all edges.`,
    codeLine: 0,
    type: 'init'
  });

  const V = nodes.length;
  let relaxationCount = 0;
  let changed;

  for (let i = 1; i < V; i++) {
    changed = false;
    
    // Log start of iteration i
    steps.push({
      currentNodeId: null,
      visited: [],
      distances: { ...distances },
      parents: { ...parents },
      queue: [],
      highlightedEdgeId: null,
      action: `Start relaxation pass ${i} of ${V - 1}.`,
      explanation: `Beginning iteration pass ${i}. In each pass, we check every single edge in the network to see if we can relax distances.`,
      codeLine: 1,
      type: 'extract'
    });

    for (const edge of edges) {
      const u = edge.from;
      const v = edge.to;
      const fromNode = nodes.find(n => n.id === u);
      const toNode = nodes.find(n => n.id === v);
      
      if (!fromNode || !toNode || fromNode.type === 'wall' || toNode.type === 'wall') continue;
      
      // Since it's directed/undirected:
      const directions = [{ src: u, dest: v, dir: true }];
      if (!edge.directed) {
        directions.push({ src: v, dest: u, dir: false });
      }

      for (const d of directions) {
        const srcId = d.src;
        const destNodeId = d.dest;
        
        if (distances[srcId] === Infinity) continue;
        
        const srcNode = nodes.find(n => n.id === srcId);
        const destNode = nodes.find(n => n.id === destNodeId);
        
        const weight = getEdgeWeight(srcNode, destNode, edge, weightMode, scaleMultiplier);
        const alt = distances[srcId] + weight;
        const currentNeighborDist = distances[destNodeId];
        
        if (alt < currentNeighborDist) {
          relaxationCount++;
          distances[destNodeId] = alt;
          parents[destNodeId] = { nodeId: srcId, edgeId: edge.id };
          changed = true;
          
          steps.push({
            currentNodeId: srcId,
            visited: [],
            distances: { ...distances },
            parents: { ...parents },
            queue: [],
            highlightedEdgeId: edge.id,
            action: `Relax edge ${srcId} ➔ ${destNodeId}: updated distance to ${alt.toFixed(2)}.`,
            explanation: `During pass ${i}, we relaxed edge ${srcId} ➔ ${destNodeId}. The path cost (${distances[srcId].toFixed(2)} + ${weight.toFixed(2)} = ${alt.toFixed(2)}) is shorter than ${currentNeighborDist === Infinity ? 'Infinity' : currentNeighborDist.toFixed(2)}.`,
            codeLine: 4,
            type: 'relax-success'
          });
        }
      }
    }
    
    // Early exit if no changes
    if (!changed) {
      steps.push({
        currentNodeId: null,
        visited: [],
        distances: { ...distances },
        parents: { ...parents },
        queue: [],
        highlightedEdgeId: null,
        action: `Pass ${i}: No changes in distance profile. Terminating early.`,
        explanation: `During pass ${i}, no distances were updated. Since no shorter paths can be found in subsequent passes, Bellman-Ford terminates early.`,
        codeLine: 1,
        type: 'done',
        relaxationCount
      });
      return steps;
    }
  }

  // Negative cycle checks (not applicable here, but shown for completeness)
  steps.push({
    currentNodeId: null,
    visited: [],
    distances: { ...distances },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: `Bellman-Ford completes successfully!`,
    explanation: `Completed relaxation passes. Graph contains no negative-weight cycles and all reachable shortest paths have been established.`,
    codeLine: 6,
    type: 'done',
    relaxationCount
  });

  return steps;
};

// --- BFS (BREADTH-FIRST SEARCH) ---
export const BFS_PSEUDOCODE = [
  "Initialize Queue Q, mark source as visited",
  "Q.enqueue(source)",
  "while Q is not empty:",
  "  u = Q.dequeue()",
  "  if u == destination: stop search",
  "  for each neighbor v of u:",
  "    if v is not visited:",
  "      mark v as visited, parent[v] = u",
  "      Q.enqueue(v)"
];

export const runBFSSteps = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const adj = buildAdjacencyList(nodes, edges, weightMode, scaleMultiplier);
  const steps = [];
  const distances = {};
  const parents = {};
  const visited = new Set();
  
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  
  distances[sourceId] = 0;
  visited.add(sourceId);
  
  let queue = [sourceId];
  
  steps.push({
    currentNodeId: null,
    visited: [sourceId],
    distances: { ...distances },
    parents: { ...parents },
    queue: queue.map(id => ({ nodeId: id, priority: 0 })),
    highlightedEdgeId: null,
    action: `Initialize BFS: Enqueue source node ${sourceId}.`,
    explanation: `BFS uses a queue (First-In, First-Out) to explore nodes level-by-level, starting from ${sourceId}. Node ${sourceId} is marked visited.`,
    codeLine: 0,
    type: 'init'
  });

  while (queue.length > 0) {
    const currId = queue.shift();
    
    steps.push({
      currentNodeId: currId,
      visited: Array.from(visited),
      distances: { ...distances },
      parents: { ...parents },
      queue: queue.map(id => ({ nodeId: id, priority: 0 })),
      highlightedEdgeId: null,
      action: `Extract node ${currId} from queue front.`,
      explanation: `We dequeue node ${currId} to examine its unvisited neighbors. BFS guarantees the shortest path in terms of edge count (unweighted).`,
      codeLine: 3,
      type: 'extract'
    });
    
    if (destId && currId === destId) {
      steps.push({
        currentNodeId: currId,
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        queue: queue.map(id => ({ nodeId: id, priority: 0 })),
        highlightedEdgeId: null,
        action: `Reached destination node ${destId}!`,
        explanation: `Destination node ${destId} popped from queue. BFS unweighted path reconstruction is complete.`,
        codeLine: 4,
        type: 'done'
      });
      return steps;
    }
    
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.nodeId;
      
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        distances[neighborId] = distances[currId] + 1; // Unweighted distance
        parents[neighborId] = { nodeId: currId, edgeId: edge.edgeId };
        queue.push(neighborId);
        
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          queue: queue.map(id => ({ nodeId: id, priority: 0 })),
          highlightedEdgeId: edge.edgeId,
          action: `Visit ${neighborId} via ${currId}: enqueue node.`,
          explanation: `Neighbor ${neighborId} has not been visited yet. We mark it visited, update parent[${neighborId}] = ${currId}, and add it to the back of the queue.`,
          codeLine: 8,
          type: 'relax-success'
        });
      } else {
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          queue: queue.map(id => ({ nodeId: id, priority: 0 })),
          highlightedEdgeId: edge.edgeId,
          action: `Skip neighbor ${neighborId}: already visited.`,
          explanation: `Neighbor ${neighborId} was already visited/queued earlier, so we skip it to prevent cycles or redundant scans.`,
          codeLine: 7,
          type: 'relax-skip'
        });
      }
    }
  }
  
  const destReached = destId ? visited.has(destId) : true;
  steps.push({
    currentNodeId: null,
    visited: Array.from(visited),
    distances: { ...distances },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: destReached ? "BFS traversal complete!" : `Destination node ${destId} is unreachable.`,
    explanation: destReached ? "Completed BFS traversal for all reachable nodes." : `No pathway exists to destination ${destId}.`,
    codeLine: 2,
    type: destReached ? 'done' : 'unreachable'
  });
  
  return steps;
};

// --- DFS (DEPTH-FIRST SEARCH) ---
export const DFS_PSEUDOCODE = [
  "Initialize Stack S",
  "S.push(source)",
  "while S is not empty:",
  "  u = S.pop()",
  "  if u is not visited:",
  "    mark u as visited",
  "    if u == destination: stop search",
  "    for each neighbor v of u (unvisited):",
  "      parent[v] = u",
  "      S.push(v)"
];

export const runDFSSteps = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const adj = buildAdjacencyList(nodes, edges, weightMode, scaleMultiplier);
  const steps = [];
  const distances = {};
  const parents = {};
  const visited = new Set();
  
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  
  distances[sourceId] = 0;
  let stack = [sourceId];
  
  steps.push({
    currentNodeId: null,
    visited: [],
    distances: { ...distances },
    parents: { ...parents },
    queue: stack.map(id => ({ nodeId: id, priority: 0 })), // Display stack in queue viewer
    highlightedEdgeId: null,
    action: `Initialize DFS: Push source node ${sourceId} to stack.`,
    explanation: `DFS uses a stack (Last-In, First-Out) to explore as deep as possible along each branch before backtracking.`,
    codeLine: 1,
    type: 'init'
  });

  while (stack.length > 0) {
    const currId = stack.pop();
    
    if (visited.has(currId)) {
      steps.push({
        currentNodeId: currId,
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        queue: stack.map(id => ({ nodeId: id, priority: 0 })),
        highlightedEdgeId: null,
        action: `Pop ${currId} from stack: already visited, skip.`,
        explanation: `Node ${currId} was popped from stack but has already been visited. We skip processing it.`,
        codeLine: 3,
        type: 'relax-skip'
      });
      continue;
    }
    
    visited.add(currId);
    
    steps.push({
      currentNodeId: currId,
      visited: Array.from(visited),
      distances: { ...distances },
      parents: { ...parents },
      queue: stack.map(id => ({ nodeId: id, priority: 0 })),
      highlightedEdgeId: null,
      action: `Mark ${currId} as visited.`,
      explanation: `Pushed node ${currId} popped from stack. We mark it visited and inspect its neighbors.`,
      codeLine: 5,
      type: 'extract'
    });
    
    if (destId && currId === destId) {
      steps.push({
        currentNodeId: currId,
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        queue: stack.map(id => ({ nodeId: id, priority: 0 })),
        highlightedEdgeId: null,
        action: `Reached destination node ${destId}!`,
        explanation: `Destination node ${destId} reached during DFS path finding traversal. Path is recovered.`,
        codeLine: 6,
        type: 'done'
      });
      return steps;
    }
    
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.nodeId;
      if (!visited.has(neighborId)) {
        distances[neighborId] = distances[currId] + 1; // Unweighted depth count
        parents[neighborId] = { nodeId: currId, edgeId: edge.edgeId };
        stack.push(neighborId);
        
        steps.push({
          currentNodeId: currId,
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          queue: stack.map(id => ({ nodeId: id, priority: 0 })),
          highlightedEdgeId: edge.edgeId,
          action: `Set parent[${neighborId}] = ${currId} and push ${neighborId} to stack.`,
          explanation: `Neighbor ${neighborId} is unvisited. We set its parent and push it onto the stack to explore next.`,
          codeLine: 9,
          type: 'relax-success'
        });
      }
    }
  }
  
  const destReached = destId ? visited.has(destId) : true;
  steps.push({
    currentNodeId: null,
    visited: Array.from(visited),
    distances: { ...distances },
    parents: { ...parents },
    queue: [],
    highlightedEdgeId: null,
    action: destReached ? "DFS search complete!" : `Destination node ${destId} is unreachable.`,
    explanation: destReached ? "Completed DFS traversal." : `No pathway exists to destination ${destId}.`,
    codeLine: 2,
    type: destReached ? 'done' : 'unreachable'
  });
  
  return steps;
};

// Lightweight Dijkstra solver returning final distance and parent mapping to destination
export const computeShortestPath = (nodes, edges, sourceId, destId, weightMode, scaleMultiplier) => {
  const adj = buildAdjacencyList(nodes, edges, weightMode, scaleMultiplier);
  const distances = {};
  const parents = {};
  const visited = new Set();
  
  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  distances[sourceId] = 0;
  
  let queue = [{ nodeId: sourceId, priority: 0 }];
  
  while (queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const current = queue.shift();
    const currId = current.nodeId;
    const currDist = current.priority;
    
    if (visited.has(currId)) continue;
    visited.add(currId);
    
    if (destId && currId === destId) {
      break;
    }
    
    const neighbors = adj[currId] || [];
    for (const edge of neighbors) {
      const neighborId = edge.nodeId;
      if (visited.has(neighborId)) continue;
      
      const alt = currDist + edge.weight;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        parents[neighborId] = { nodeId: currId, edgeId: edge.edgeId };
        
        const existingIdx = queue.findIndex(q => q.nodeId === neighborId);
        if (existingIdx !== -1) {
          queue[existingIdx].priority = alt;
        } else {
          queue.push({ nodeId: neighborId, priority: alt });
        }
      }
    }
  }
  
  return { distance: distances[destId], parents };
};

