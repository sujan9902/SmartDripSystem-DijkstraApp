import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  HelpCircle, 
  Activity, 
  Grid, 
  Network, 
  Sliders, 
  Sun, 
  Moon, 
  Compass, 
  FileSpreadsheet, 
  Droplet, 
  ChevronRight, 
  RefreshCw,
  PlusCircle,
  Link,
  MousePointer,
  Sparkles,
  MapPin,
  Flag,
  Wrench,
  BookOpen,
  Keyboard
} from 'lucide-react';

import {
  PIPE_PRESETS,
  runDijkstraSteps,
  runAStarSteps,
  runBellmanFordSteps,
  runBFSSteps,
  runDFSSteps,
  DIJKSTRA_PSEUDOCODE,
  ASTAR_PSEUDOCODE,
  BELLMAN_FORD_PSEUDOCODE,
  BFS_PSEUDOCODE,
  DFS_PSEUDOCODE,
  computeShortestPath
} from './algorithms/pathfinding';

// Prebuilt Graph Layouts
const PREBUILT_GRAPHS = {
  hydraulic: {
    name: "Hydraulic Irrigation Grid",
    mode: "hydraulic",
    nodes: [
      { id: 'BASIN_P1', name: 'High-Output Supply Reservoir', type: 'pump', x: 150, y: 150, z: 25, maxFlow: 800, pressurePSI: 85 },
      { id: 'AQUIFER_P2', name: 'Deep Well Pump Station', type: 'pump', x: 200, y: 550, z: 10, maxFlow: 500, pressurePSI: 65 },
      { id: 'VALVE_J1', name: 'Central Pressure Manifold', type: 'junction', x: 450, y: 350, z: 15 },
      { id: 'CROP_204', name: 'Alfalfa Irrigation Grid', type: 'crop', x: 750, y: 200, z: 22, flowDemand: 220, currentReceived: 0, hydration: 60 },
      { id: 'CROP_205', name: 'Orchard Micro-Spray Sector', type: 'crop', x: 800, y: 500, z: 14, flowDemand: 140, currentReceived: 0, hydration: 45 }
    ],
    edges: [
      { id: 'PIPE_01', from: 'BASIN_P1', to: 'VALVE_J1', weight: 15, pipeType: 'mainline', directed: false },
      { id: 'PIPE_02', from: 'AQUIFER_P2', to: 'VALVE_J1', weight: 20, pipeType: 'mainline', directed: false },
      { id: 'PIPE_03', from: 'VALVE_J1', to: 'CROP_204', weight: 18, pipeType: 'submain', directed: false },
      { id: 'PIPE_04', from: 'VALVE_J1', to: 'CROP_205', weight: 12, pipeType: 'lateral', directed: false }
    ],
    source: 'BASIN_P1',
    dest: 'CROP_204'
  },
  complex: {
    name: "Dense Multi-Route Grid",
    mode: "pathfinding",
    nodes: [
      { id: 'A', name: 'Source Reservoir', type: 'pump', x: 100, y: 300, z: 10, maxFlow: 800, pressurePSI: 80 },
      { id: 'B', name: 'West Gate', type: 'junction', x: 280, y: 160, z: 15 },
      { id: 'C', name: 'South Gate', type: 'junction', x: 280, y: 440, z: 5 },
      { id: 'D', name: 'Central Hub', type: 'junction', x: 480, y: 300, z: 20 },
      { id: 'E', name: 'East Manifold', type: 'junction', x: 680, y: 160, z: 12 },
      { id: 'F', name: 'South East Manifold', type: 'junction', x: 680, y: 440, z: 8 },
      { id: 'Z', name: 'Primary Crop Field', type: 'crop', x: 850, y: 300, z: 15, flowDemand: 300, currentReceived: 0, hydration: 50 }
    ],
    edges: [
      { id: 'E1', from: 'A', to: 'B', weight: 10, pipeType: 'mainline', directed: false },
      { id: 'E2', from: 'A', to: 'C', weight: 15, pipeType: 'mainline', directed: false },
      { id: 'E3', from: 'B', to: 'D', weight: 12, pipeType: 'submain', directed: false },
      { id: 'E4', from: 'C', to: 'D', weight: 8, pipeType: 'submain', directed: false },
      { id: 'E5', from: 'B', to: 'E', weight: 20, pipeType: 'submain', directed: false },
      { id: 'E6', from: 'C', to: 'F', weight: 22, pipeType: 'submain', directed: false },
      { id: 'E7', from: 'D', to: 'E', weight: 10, pipeType: 'submain', directed: false },
      { id: 'E8', from: 'D', to: 'F', weight: 14, pipeType: 'submain', directed: false },
      { id: 'E9', from: 'E', to: 'Z', weight: 15, pipeType: 'lateral', directed: false },
      { id: 'E10', from: 'F', to: 'Z', weight: 10, pipeType: 'lateral', directed: false }
    ],
    source: 'A',
    dest: 'Z'
  },
  directed: {
    name: "Directed Flow Ring",
    mode: "pathfinding",
    nodes: [
      { id: 'N1', name: 'Station 1', type: 'pump', x: 300, y: 150, z: 20, maxFlow: 500, pressurePSI: 70 },
      { id: 'N2', name: 'Station 2', type: 'junction', x: 650, y: 150, z: 15 },
      { id: 'N3', name: 'Station 3', type: 'junction', x: 650, y: 450, z: 10 },
      { id: 'N4', name: 'Station 4', type: 'crop', x: 300, y: 450, z: 25, flowDemand: 150, currentReceived: 0, hydration: 50 }
    ],
    edges: [
      { id: 'DE1', from: 'N1', to: 'N2', weight: 10, pipeType: 'mainline', directed: true },
      { id: 'DE2', from: 'N2', to: 'N3', weight: 15, pipeType: 'submain', directed: true },
      { id: 'DE3', from: 'N3', to: 'N4', weight: 20, pipeType: 'lateral', directed: true },
      { id: 'DE4', from: 'N4', to: 'N1', weight: 5, pipeType: 'lateral', directed: true }
    ],
    source: 'N1',
    dest: 'N4'
  }
};

const generateRandomId = (prefix) => `${prefix}_${Math.floor(100 + Math.random() * 900)}`;

const findNearestPump = (nodes, edges, destId, weightMode, scaleMultiplier) => {
  const pumps = nodes.filter(n => n.type === 'pump' && n.type !== 'wall');
  let bestPumpId = null;
  let minCost = Infinity;
  let bestParents = null;
  
  pumps.forEach(pump => {
    const res = computeShortestPath(nodes, edges, pump.id, destId, weightMode, scaleMultiplier);
    if (res.distance < minCost) {
      minCost = res.distance;
      bestPumpId = pump.id;
      bestParents = res.parents;
    }
  });
  
  return { pumpId: bestPumpId, distance: minCost, parents: bestParents };
};

export default function App() {
  // Navigation
  const [view, setView] = useState('canvas'); // 'dashboard', 'canvas', 'analysis', 'settings', 'help'
  const [simulationMode, setSimulationMode] = useState('pathfinding'); // 'pathfinding', 'hydraulic'

  // Theme configuration
  const [themeAccent, setThemeAccent] = useState('cyan'); // 'cyan', 'indigo', 'emerald', 'amber'
  const [isDark, setIsDark] = useState(true);

  // Graph state variables
  const [nodes, setNodes] = useState(PREBUILT_GRAPHS.hydraulic.nodes);
  const [edges, setEdges] = useState(PREBUILT_GRAPHS.hydraulic.edges);
  
  // General Pathfinding configs
  const [sourceNodeId, setSourceNodeId] = useState('BASIN_P1');
  const [destNodeId, setDestNodeId] = useState('CROP_204');
  const [algorithm, setAlgorithm] = useState('dijkstra'); // 'dijkstra', 'astar', 'bellman', 'bfs', 'dfs'
  const [weightMode, setWeightMode] = useState('hydraulic'); // 'manual', 'euclidean', 'hydraulic'
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0);

  // Inspector targets
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Canvas interaction configurations
  const [activeTool, setActiveTool] = useState('select'); // 'select', 'pan', 'addPump', 'addJunction', 'addCrop', 'addEdge', 'wall', 'setSource', 'setDest'
  
  // Dragging, zooming, panning states
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const [connectingSourceId, setConnectingSourceId] = useState(null);

  // Undo/Redo Stacks
  const [history, setHistory] = useState(() => [{
    nodes: JSON.parse(JSON.stringify(PREBUILT_GRAPHS.hydraulic.nodes)),
    edges: JSON.parse(JSON.stringify(PREBUILT_GRAPHS.hydraulic.edges))
  }]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Live Logs Terminal
  const [logs, setLogs] = useState([
    { id: 1, type: 'info', time: '10:00:00', msg: 'HydroGuard CAD Visualizer environment loaded.' }
  ]);

  // Simulation player loop configs
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(400); // milliseconds
  const [isHydraulicLooping, setIsHydraulicLooping] = useState(true);

  const canvasRef = useRef(null);
  const playTimerRef = useRef(null);

  // Helper logger
  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      { id: Date.now() + Math.random(), type, time, msg },
      ...prev.slice(0, 49)
    ]);
  }, []);

  // Sync default source/dest on change (state-in-render pattern)
  const [prevNodes, setPrevNodes] = useState(nodes);
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    if (nodes.length > 0) {
      if (sourceNodeId !== 'AUTO_NEAREST' && !nodes.some(n => n.id === sourceNodeId)) {
        const firstPump = nodes.find(n => n.type === 'pump') || nodes[0];
        setSourceNodeId(firstPump.id);
      }
      if (!nodes.some(n => n.id === destNodeId)) {
        const lastCrop = [...nodes].reverse().find(n => n.type === 'crop') || nodes[nodes.length - 1];
        if (lastCrop.id !== sourceNodeId) {
          setDestNodeId(lastCrop.id);
        } else {
          setDestNodeId(nodes[0].id !== sourceNodeId ? nodes[0].id : '');
        }
      }
    }
  }

  // Push historical state for Undo/Redo
  const recordHistory = (newNodes, newEdges) => {
    const nextHist = history.slice(0, historyIdx + 1);
    const snap = {
      nodes: JSON.parse(JSON.stringify(newNodes)),
      edges: JSON.parse(JSON.stringify(newEdges))
    };
    nextHist.push(snap);
    if (nextHist.length > 50) nextHist.shift();
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setNodes(JSON.parse(JSON.stringify(prev.nodes)));
      setEdges(JSON.parse(JSON.stringify(prev.edges)));
      setHistoryIdx(historyIdx - 1);
      addLog("Undo completed.", "warning");
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setNodes(JSON.parse(JSON.stringify(next.nodes)));
      setEdges(JSON.parse(JSON.stringify(next.edges)));
      setHistoryIdx(historyIdx + 1);
      addLog("Redo completed.", "info");
    }
  };

  // History is initialized in state declaration, no mount effect needed

  // Auto-run pathfinding steps when graph or algorithm choices change
  const steps = useMemo(() => {
    if (simulationMode !== 'pathfinding') return [];
    
    let actualSourceId = sourceNodeId;
    let autoResolvedText = "";
    
    if (sourceNodeId === 'AUTO_NEAREST') {
      if (!destNodeId) return [];
      const { pumpId, distance } = findNearestPump(nodes, edges, destNodeId, weightMode, scaleMultiplier);
      if (pumpId && distance !== Infinity) {
        actualSourceId = pumpId;
        autoResolvedText = `Nearest reservoir dynamically resolved to: ${pumpId} (Distance: ${distance.toFixed(1)}m)`;
      } else {
        actualSourceId = null;
      }
    }
    
    if (!actualSourceId || !nodes.some(n => n.id === actualSourceId)) return [];
    
    // Choose correct algorithm
    let stepList = [];
    
    if (algorithm === 'dijkstra') {
      stepList = runDijkstraSteps(nodes, edges, actualSourceId, destNodeId, weightMode, scaleMultiplier);
    } else if (algorithm === 'astar') {
      stepList = runAStarSteps(nodes, edges, actualSourceId, destNodeId, weightMode, scaleMultiplier);
    } else if (algorithm === 'bellman') {
      stepList = runBellmanFordSteps(nodes, edges, actualSourceId, destNodeId, weightMode, scaleMultiplier);
    } else if (algorithm === 'bfs') {
      stepList = runBFSSteps(nodes, edges, actualSourceId, destNodeId, weightMode, scaleMultiplier);
    } else if (algorithm === 'dfs') {
      stepList = runDFSSteps(nodes, edges, actualSourceId, destNodeId, weightMode, scaleMultiplier);
    }
    
    const mockRuntime = (stepList.length * 0.012 + 0.05).toFixed(3);
    if (stepList.length > 0) {
      stepList[stepList.length - 1].runtime = mockRuntime;
      // Add resolvedSourceId to steps
      stepList.forEach(s => {
        s.resolvedSourceId = actualSourceId;
        if (autoResolvedText) {
          s.action = `[Auto-Source Mode] ${s.action}`;
          s.explanation = `${autoResolvedText}. ${s.explanation}`;
        }
      });
    }
    return stepList;
  }, [nodes, edges, sourceNodeId, destNodeId, algorithm, weightMode, scaleMultiplier, simulationMode]);

  // Load pathfinding steps (state-in-render pattern)
  const [prevSteps, setPrevSteps] = useState(null);
  if (steps !== prevSteps) {
    setPrevSteps(steps);
    if (simulationMode === 'pathfinding') {
      setCurrentStepIdx(0);
      setIsPlaying(false);
    }
  }

  // Active step values
  const activeStep = useMemo(() => {
    if (simulationMode !== 'pathfinding' || steps.length === 0) return null;
    const idx = Math.min(Math.max(0, currentStepIdx), steps.length - 1);
    return steps[idx];
  }, [steps, currentStepIdx, simulationMode]);

  // Path reconstruction at current step
  const shortestPathEdges = useMemo(() => {
    if (simulationMode !== 'pathfinding' || !activeStep || !destNodeId) return [];
    const path = new Set();
    let current = destNodeId;
    const maxLoops = nodes.length;
    let loops = 0;
    const resolvedSourceId = activeStep.resolvedSourceId || sourceNodeId;
    while (current && current !== resolvedSourceId && loops < maxLoops) {
      const parentInfo = activeStep.parents[current];
      if (parentInfo && parentInfo.edgeId) {
        path.add(parentInfo.edgeId);
        current = parentInfo.nodeId;
      } else {
        break;
      }
      loops++;
    }
    return Array.from(path);
  }, [activeStep, destNodeId, sourceNodeId, nodes.length, simulationMode]);

  // Playback timer controls
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      clearInterval(playTimerRef.current);
    }
    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, steps, playSpeed]);

  // HYDRAULIC SIMULATION MODE RESOLUTION
  const hydraulicHydraulics = useMemo(() => {
    if (simulationMode !== 'hydraulic') return { inputs: {}, flows: {}, losses: {}, allocations: {} };
    
    const nodeAllocatedInputs = {};
    const edgeCalculatedFlows = {};
    const edgeCalculatedLosses = {};
    const cropAllocations = {};

    nodes.forEach(n => nodeAllocatedInputs[n.id] = 0);
    edges.forEach(e => {
      edgeCalculatedFlows[e.id] = 0;
      edgeCalculatedLosses[e.id] = 0;
    });

    const consumerCrops = nodes.filter(n => n.type === 'crop');

    // For each crop field, find the nearest pump station and its shortest route using Dijkstra
    consumerCrops.forEach(crop => {
      const { pumpId, distance, parents } = findNearestPump(nodes, edges, crop.id, weightMode, scaleMultiplier);
      
      if (pumpId && distance !== Infinity) {
        nodeAllocatedInputs[crop.id] = crop.flowDemand;
        cropAllocations[crop.id] = { pumpId, distance, connected: true };
        
        // Reconstruct path to allocate flow to edges
        let current = crop.id;
        const maxLoops = nodes.length;
        let loops = 0;
        while (current && current !== pumpId && loops < maxLoops) {
          const parentInfo = parents[current];
          if (parentInfo && parentInfo.edgeId) {
            edgeCalculatedFlows[parentInfo.edgeId] = (edgeCalculatedFlows[parentInfo.edgeId] || 0) + crop.flowDemand;
            current = parentInfo.nodeId;
          } else {
            break;
          }
          loops++;
        }
      } else {
        cropAllocations[crop.id] = { pumpId: null, distance: Infinity, connected: false };
      }
    });

    edges.forEach(e => {
      const flow = edgeCalculatedFlows[e.id] || 0;
      const preset = PIPE_PRESETS[e.pipeType];
      if (!preset || flow === 0) return;
      const ratio = flow / preset.maxFlowCap;
      edgeCalculatedLosses[e.id] = parseFloat((ratio * ratio * 15 * preset.friction).toFixed(1));
    });

    return { inputs: nodeAllocatedInputs, flows: edgeCalculatedFlows, losses: edgeCalculatedLosses, allocations: cropAllocations };
  }, [nodes, edges, weightMode, scaleMultiplier, simulationMode]);

  // Hydraulic ticking loop to deplete / replenish crop hydration health indexes
  useEffect(() => {
    if (simulationMode !== 'hydraulic' || !isHydraulicLooping) return;
    const tickInterval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        if (n.type !== 'crop') return n;
        const waterIn = hydraulicHydraulics.inputs[n.id] || 0;
        const waterDemand = n.flowDemand || 100;
        const netHydrationChange = waterIn >= waterDemand ? 1.5 : -1.0;
        return {
          ...n,
          currentReceived: waterIn,
          hydration: parseFloat(Math.max(0, Math.min(100, n.hydration + netHydrationChange)).toFixed(1))
        };
      }));
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [simulationMode, isHydraulicLooping, hydraulicHydraulics]);

  // SVG coordinate converter
  const getMouseCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left - panX) / zoom),
      y: Math.round((e.clientY - rect.top - panY) / zoom)
    };
  };

  // Drag start
  const handleNodeDragStart = (nodeId, e) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setSelectedEdgeId(null);
    setSelectedNodeId(nodeId);
  };

  // Mouse move on canvas
  const handleMouseMove = (e) => {
    const coords = getMouseCoords(e);
    setMouseCanvasPos(coords);

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (draggingNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id !== draggingNodeId) return n;
        return { ...n, x: coords.x, y: coords.y };
      }));
    }
  };

  // Drag end
  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      recordHistory(nodes, edges);
      addLog("Node dragged and repositioned.", "info");
    }
    setIsPanning(false);
  };

  // Canvas click to add / connect nodes
  const handleCanvasClick = (e) => {
    if (isPanning) return;
    
    // Deselect if clicking on empty spot
    if (e.target.tagName === 'svg' || e.target.id === 'canvas-catch') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setConnectingSourceId(null);
    }

    const coords = getMouseCoords(e);

    if (activeTool === 'addPump' || activeTool === 'addJunction' || activeTool === 'addCrop') {
      const id = generateRandomId('N');
      const type = activeTool === 'addPump' ? 'pump' : (activeTool === 'addJunction' ? 'junction' : 'crop');
      const names = {
        pump: "Custom Pump Station",
        junction: "Pipe Network Junction",
        crop: "Irrigation Sector Grid"
      };
      
      const newNode = {
        id,
        name: names[type] || "Intermediate Point",
        type,
        x: coords.x,
        y: coords.y,
        z: 10,
        ...(type === 'pump' ? { maxFlow: 600, pressurePSI: 70 } : {}),
        ...(type === 'crop' ? { flowDemand: 150, currentReceived: 0, hydration: 50 } : {})
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      recordHistory(newNodes, edges);
      addLog(`Added node ${id} (${type}).`, 'success');
      setActiveTool('select');
    }
  };

  // Node click events
  const handleNodeClick = (node, e) => {
    e.stopPropagation();

    if (activeTool === 'select') {
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
      return;
    }

    if (activeTool === 'setSource') {
      setSourceNodeId(node.id);
      addLog(`Set source node to ${node.id}.`, 'info');
      setActiveTool('select');
      return;
    }

    if (activeTool === 'setDest') {
      setDestNodeId(node.id);
      addLog(`Set destination node to ${node.id}.`, 'info');
      setActiveTool('select');
      return;
    }

    if (activeTool === 'addEdge') {
      if (!connectingSourceId) {
        setConnectingSourceId(node.id);
        addLog(`Select second node to establish a piping link from ${node.id}.`, 'info');
      } else {
        if (connectingSourceId === node.id) {
          setConnectingSourceId(null);
          return;
        }

        const edgeExists = edges.some(edge => 
          (edge.from === connectingSourceId && edge.to === node.id) ||
          (edge.from === node.id && edge.to === connectingSourceId)
        );

        if (edgeExists) {
          addLog("Topology Rejection: A pipeline connection already exists here.", "warning");
          setConnectingSourceId(null);
          return;
        }

        const id = generateRandomId('PIPE');
        const newEdge = {
          id,
          from: connectingSourceId,
          to: node.id,
          weight: 10,
          pipeType: 'mainline',
          directed: false
        };

        const newEdges = [...edges, newEdge];
        setEdges(newEdges);
        recordHistory(nodes, newEdges);
        addLog(`Created pipe route ${id} from ${connectingSourceId} to ${node.id}.`, 'success');
        setConnectingSourceId(null);
        setActiveTool('select');
      }
    }

    if (activeTool === 'wall') {
      // Toggle cell wall state
      setNodes(prev => prev.map(n => {
        if (n.id !== node.id) return n;
        return {
          ...n,
          type: n.type === 'wall' ? 'junction' : 'wall'
        };
      }));
      recordHistory(nodes, edges);
    }
  };

  // Zoom controls
  const handleZoom = useCallback((factor) => {
    setZoom(z => Math.min(3.5, Math.max(0.3, z * factor)));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    handleZoom(factor);
  }, [handleZoom]);

  useEffect(() => {
    const el = canvasRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Clean / Prebuilt loaders
  const loadPreset = (key) => {
    const preset = PREBUILT_GRAPHS[key];
    if (preset) {
      setNodes(JSON.parse(JSON.stringify(preset.nodes)));
      setEdges(JSON.parse(JSON.stringify(preset.edges)));
      setSourceNodeId(preset.source);
      setDestNodeId(preset.dest);
      setSimulationMode(preset.mode);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      recordHistory(preset.nodes, preset.edges);
      addLog(`Loaded preset graph: ${preset.name}`, 'info');
    }
  };

  // Random graph generator
  const generateRandomGraph = () => {
    const newNodes = [];
    const newEdges = [];
    const numNodes = 10;
    const padding = 120;
    
    // Spawn nodes
    for (let i = 0; i < numNodes; i++) {
      const type = i === 0 ? 'pump' : (i === numNodes - 1 ? 'crop' : (Math.random() > 0.6 ? 'crop' : 'junction'));
      newNodes.push({
        id: `RN_${i}`,
        name: type === 'pump' ? `Pump Station ${i}` : type === 'crop' ? `Crop Field ${i}` : `Manifold ${i}`,
        type,
        x: Math.round(padding + Math.random() * (750 - padding)),
        y: Math.round(padding + Math.random() * (450 - padding)),
        z: Math.round(5 + Math.random() * 25),
        ...(type === 'pump' ? { maxFlow: 500, pressurePSI: 60 } : {}),
        ...(type === 'crop' ? { flowDemand: 120, hydration: 50 } : {})
      });
    }

    // Spawn edges using simple distance threshold
    let edgeCounter = 1;
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const dist = Math.hypot(newNodes[i].x - newNodes[j].x, newNodes[i].y - newNodes[j].y);
        // Connect if close enough and limit density
        if (dist < 260 && Math.random() > 0.3) {
          newEdges.push({
            id: `RP_${edgeCounter++}`,
            from: newNodes[i].id,
            to: newNodes[j].id,
            weight: Math.round(dist / 10),
            pipeType: Math.random() > 0.5 ? 'mainline' : 'submain',
            directed: false
          });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setSourceNodeId('RN_0');
    setDestNodeId(`RN_${numNodes - 1}`);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    recordHistory(newNodes, newEdges);
    addLog("Generated random coordinates hydraulic mesh.", "success");
  };

  // Generate Maze Grid
  const generateGridMaze = () => {
    const gridNodes = [];
    const gridEdges = [];
    const rows = 12;
    const cols = 16;
    const size = 42;
    const offsetX = 100;
    const offsetY = 80;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = `G_${r}_${c}`;
        // Randomly set walls (20% density) excluding start/end
        const isWall = (r === 2 && c > 2 && c < 12) || (r === 8 && c > 4 && c < 14) || (Math.random() > 0.85 && !(r === 1 && c === 1) && !(r === 10 && c === 14));
        
        gridNodes.push({
          id,
          name: `Grid Cell [${r}, ${c}]`,
          type: isWall ? 'wall' : 'junction',
          x: c * size + offsetX,
          y: r * size + offsetY,
          z: 10
        });

        // Add connections to north and west neighbors
        if (c > 0) {
          gridEdges.push({
            id: `GE_H_${r}_${c}`,
            from: `G_${r}_${c-1}`,
            to: id,
            weight: 10,
            pipeType: 'submain',
            directed: false
          });
        }
        if (r > 0) {
          gridEdges.push({
            id: `GE_V_${r}_${c}`,
            from: `G_${r-1}_${c}`,
            to: id,
            weight: 10,
            pipeType: 'submain',
            directed: false
          });
        }
      }
    }

    setNodes(gridNodes);
    setEdges(gridEdges);
    setSourceNodeId('G_1_1');
    setDestNodeId('G_10_14');
    setWeightMode('euclidean');
    setSimulationMode('pathfinding');
    setActiveTool('wall'); // set active tool to Wall Paint for quick editing
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    recordHistory(gridNodes, gridEdges);
    addLog("Generated pathfinding maze. Select Wall tool to click and build blockers.", "success");
  };

  // Erase Graph
  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setSourceNodeId('');
    setDestNodeId('');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    recordHistory([], []);
    addLog("Graph cleared.", "warning");
  };

  // Node CRUD modifications from inspector
  const updateNodeProperty = (id, field, val) => {
    const updated = nodes.map(n => {
      if (n.id !== id) return n;
      return { ...n, [field]: val };
    });
    setNodes(updated);
    recordHistory(updated, edges);
  };

  const deleteNode = (id) => {
    const updatedNodes = nodes.filter(n => n.id !== id);
    const updatedEdges = edges.filter(e => e.from !== id && e.to !== id);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNodeId(null);
    recordHistory(updatedNodes, updatedEdges);
    addLog(`Deleted node ${id}.`, 'warning');
  };

  // Edge CRUD modifications
  const updateEdgeProperty = (id, field, val) => {
    const updated = edges.map(e => {
      if (e.id !== id) return e;
      return { ...e, [field]: val };
    });
    setEdges(updated);
    recordHistory(nodes, updated);
  };

  const deleteEdge = (id) => {
    const updatedEdges = edges.filter(e => e.id !== id);
    setEdges(updatedEdges);
    setSelectedEdgeId(null);
    recordHistory(nodes, updatedEdges);
    addLog(`Deleted pipe edge ${id}.`, 'warning');
  };

  // Save JSON
  const saveGraphJSON = () => {
    const payload = JSON.stringify({ nodes, edges, sourceNodeId, destNodeId, weightMode, simulationMode });
    localStorage.setItem('hydroguard_graph', payload);
    addLog("Graph configurations saved to LocalStorage.", "success");
  };

  // Load JSON
  const loadGraphJSON = () => {
    const saved = localStorage.getItem('hydroguard_graph');
    if (saved) {
      try {
        const payload = JSON.parse(saved);
        if (payload.nodes && payload.edges) {
          setNodes(payload.nodes);
          setEdges(payload.edges);
          if (payload.sourceNodeId) setSourceNodeId(payload.sourceNodeId);
          if (payload.destNodeId) setDestNodeId(payload.destNodeId);
          if (payload.weightMode) setWeightMode(payload.weightMode);
          if (payload.simulationMode) setSimulationMode(payload.simulationMode);
          recordHistory(payload.nodes, payload.edges);
          addLog("Restored graph from LocalStorage.", "success");
        }
      } catch {
        addLog("Parsing error reading saved configurations.", "error");
      }
    } else {
      addLog("No saved configuration found in LocalStorage.", "warning");
    }
  };

  // Export JSON file download
  const exportJSONFile = () => {
    const payload = JSON.stringify({ nodes, edges, sourceNodeId, destNodeId, weightMode });
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydroguard_graph_${Date.now()}.json`;
    link.click();
    addLog("Downloaded JSON graph matrix file.", "info");
  };

  // Import JSON file upload trigger
  const triggerImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target.result);
        if (payload.nodes && payload.edges) {
          setNodes(payload.nodes);
          setEdges(payload.edges);
          if (payload.sourceNodeId) setSourceNodeId(payload.sourceNodeId);
          if (payload.destNodeId) setDestNodeId(payload.destNodeId);
          recordHistory(payload.nodes, payload.edges);
          addLog("Imported graph config from JSON file upload.", "success");
        }
      } catch {
        addLog("Invalid file schema import.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Export SVG file download
  const exportSVGFile = () => {
    if (!canvasRef.current) return;
    const svgEl = canvasRef.current.querySelector('svg');
    if (!svgEl) return;
    const data = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hydroguard_blueprint_${Date.now()}.svg`;
    link.click();
    addLog("Downloaded SVG blueprint vector asset.", "info");
  };

  // Analytics Metrics computations
  const analyticsData = useMemo(() => {
    const totalNodesCount = nodes.length;
    const totalEdgesCount = edges.length;
    
    // Graph density = 2E / (V(V-1))
    let density = 0;
    if (totalNodesCount > 1) {
      density = (2 * totalEdgesCount) / (totalNodesCount * (totalNodesCount - 1));
    }

    // Shortest path linear length
    let pathDist = 0;
    if (simulationMode === 'pathfinding' && activeStep && destNodeId) {
      pathDist = activeStep.distances[destNodeId] || 0;
    }

    // Reachable vs unreachable
    let reachableCount = 0;
    let unreachableCount = 0;
    if (simulationMode === 'pathfinding' && activeStep) {
      Object.keys(activeStep.distances).forEach(key => {
        if (activeStep.distances[key] !== Infinity) {
          reachableCount++;
        } else {
          unreachableCount++;
        }
      });
    }

    return {
      density: density.toFixed(3),
      pathDist: pathDist === Infinity ? 'Unreachable' : pathDist.toFixed(1),
      reachable: reachableCount,
      unreachable: unreachableCount
    };
  }, [nodes, edges, activeStep, destNodeId, simulationMode]);

  const routingLedger = useMemo(() => {
    const consumerCrops = nodes.filter(n => n.type === 'crop');
    return consumerCrops.map(crop => {
      const { pumpId, distance } = findNearestPump(nodes, edges, crop.id, weightMode, scaleMultiplier);
      const pump = nodes.find(n => n.id === pumpId);
      return {
        cropId: crop.id,
        cropName: crop.name,
        pumpId: pumpId || 'None',
        pumpName: pump ? pump.name : 'Unreachable',
        distance: distance,
        demand: crop.flowDemand || 0,
        hydration: crop.hydration ?? 50,
        connected: pumpId !== null && distance !== Infinity
      };
    });
  }, [nodes, edges, weightMode, scaleMultiplier]);

  // Pseudocode matching choice
  const pseudocodeLines = useMemo(() => {
    switch (algorithm) {
      case 'dijkstra': return DIJKSTRA_PSEUDOCODE;
      case 'astar': return ASTAR_PSEUDOCODE;
      case 'bellman': return BELLMAN_FORD_PSEUDOCODE;
      case 'bfs': return BFS_PSEUDOCODE;
      case 'dfs': return DFS_PSEUDOCODE;
      default: return DIJKSTRA_PSEUDOCODE;
    }
  }, [algorithm]);

  // Color mapping based on accent selections
  const accentColors = {
    cyan: {
      primaryText: 'text-cyan-400',
      primaryBg: 'bg-cyan-500',
      primaryBorder: 'border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/40',
      glow: 'neon-glow-cyan',
      hex: '#22d3ee'
    },
    indigo: {
      primaryText: 'text-indigo-400',
      primaryBg: 'bg-indigo-600',
      primaryBorder: 'border-indigo-500/20',
      hoverBorder: 'hover:border-indigo-500/40',
      glow: 'neon-glow-indigo',
      hex: '#6366f1'
    },
    emerald: {
      primaryText: 'text-emerald-400',
      primaryBg: 'bg-emerald-500',
      primaryBorder: 'border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/40',
      glow: 'neon-glow-emerald',
      hex: '#10b981'
    },
    amber: {
      primaryText: 'text-amber-400',
      primaryBg: 'bg-amber-500',
      primaryBorder: 'border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/40',
      glow: 'neon-glow-amber',
      hex: '#f59e0b'
    }
  };

  const activeColor = accentColors[themeAccent] || accentColors.cyan;

  // Hydration summary cost calculations
  const bomSummary = useMemo(() => {
    let cost = 0;
    const lengths = { mainline: 0, submain: 0, lateral: 0 };
    edges.forEach(e => {
      const fromN = nodes.find(n => n.id === e.from);
      const toN = nodes.find(n => n.id === e.to);
      if (!fromN || !toN) return;
      const len = Math.hypot(toN.x - fromN.x, toN.y - fromN.y) * scaleMultiplier;
      lengths[e.pipeType] = (lengths[e.pipeType] || 0) + len;
      cost += len * (PIPE_PRESETS[e.pipeType]?.costPerMeter || 0);
    });
    return { cost: cost.toFixed(2), lengths };
  }, [nodes, edges, scaleMultiplier]);

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-black text-slate-200' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`}>
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <nav className={`fixed left-0 top-0 h-full w-20 hover:w-60 ${isDark ? 'bg-[#060608]/90 border-white/5' : 'bg-white border-slate-200'} border-r flex flex-col py-6 z-50 transition-all duration-300 group shadow-2xl`}>
        <div className="flex items-center px-4 mb-10 overflow-hidden shrink-0">
          <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.25)] animate-[float-gentle_4s_ease-in-out_infinite]">
            <Droplet className="text-black shrink-0" size={24} />
          </div>
          <span className="ml-4 font-black text-sm tracking-[0.25em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">HYDROGUARD</span>
        </div>
        
        {/* Navigation list */}
        <div className="flex-1 space-y-2 px-2 overflow-y-auto scrollbar-hide">
          {[
            { id: 'dashboard', icon: Activity, label: 'Analytics Panel' },
            { id: 'canvas', icon: Compass, label: 'Editor Canvas' },
            { id: 'analysis', icon: FileSpreadsheet, label: 'Data Matrices' },
            { id: 'settings', icon: Sliders, label: 'Configurations' },
            { id: 'help', icon: HelpCircle, label: 'Help & Docs' }
          ].map(tab => {
            const ActiveIcon = tab.icon;
            const isTabActive = view === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`w-full flex items-center h-12 rounded-xl transition-all duration-200 px-3 relative group/item ${
                  isTabActive 
                    ? (isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900') 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                }`}
              >
                {isTabActive && (
                  <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${activeColor.primaryBg}`} />
                )}
                <div className={`flex items-center justify-center transition-transform duration-200 ${isTabActive ? activeColor.primaryText : 'text-zinc-600 group-hover/item:text-zinc-300'}`}>
                  <ActiveIcon size={20} />
                </div>
                <span className="ml-5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Theme Accents selector in sidebar footer */}
        <div className="px-4 py-4 border-t border-white/5 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Accent Accent</div>
          <div className="flex gap-2">
            {Object.keys(accentColors).map(c => (
              <button 
                key={c}
                onClick={() => setThemeAccent(c)}
                className={`w-5 h-5 rounded-full border border-white/10 ${accentColors[c].primaryBg} ${themeAccent === c ? 'ring-2 ring-white scale-110' : ''}`}
                title={`Accent: ${c}`}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area wrapper */}
      <div className="flex-1 ml-20 min-h-screen flex flex-col relative z-10 overflow-hidden">
        
        {/* TOP PANEL - STATS AND GRAPH MODE TRIGGERS */}
        <header className={`px-8 h-20 ${isDark ? 'bg-[#060608]/90 border-white/5' : 'bg-white border-slate-200'} border-b flex items-center justify-between shrink-0 z-40 relative shadow-md`}>
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase font-heading">
                  HydroGuard v4.0 Engine
                </h1>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${
                  simulationMode === 'hydraulic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {simulationMode === 'hydraulic' ? 'Simulation Mode' : 'Step Visualizer'}
                </span>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
                {simulationMode === 'hydraulic' 
                  ? 'Real-Time Hydraulic Flow Allocation via Multi-Source Dijkstra' 
                  : `${algorithm.toUpperCase()} Pathfinding Execution Steps: ${currentStepIdx + 1} / ${steps.length}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulation mode selector */}
            <div className="flex bg-zinc-950/80 border border-white/5 p-1 rounded-xl">
              <button 
                onClick={() => { setSimulationMode('pathfinding'); addLog("Switched to Pathfinding Visualizer.", "info"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  simulationMode === 'pathfinding' ? `${activeColor.primaryBg} text-black font-bold` : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Compass size={12} /> Pathfind Mode
              </button>
              <button 
                onClick={() => { setSimulationMode('hydraulic'); addLog("Switched to Hydraulic simulation loop.", "info"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  simulationMode === 'hydraulic' ? 'bg-blue-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Droplet size={12} /> Hydraulic Sim
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="h-6 w-px bg-white/10" />

            <div className="flex gap-1">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              
              <button 
                onClick={handleUndo} 
                disabled={historyIdx <= 0}
                className="p-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                title="Undo"
              >
                <Undo size={14} />
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIdx >= history.length - 1}
                className="p-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                title="Redo"
              >
                <Redo size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* 2. DYNAMIC WORKSPACE ROUTING */}
        
        {/* VIEW 1: DASHBOARD ANALYTICS */}
        {view === 'dashboard' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-[1500px]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stat card 1 */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Network Nodes</span>
                    <span className="text-4xl font-extrabold text-white mt-1 block">{nodes.length}</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-cyan-400">
                    <Network size={22} />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-4 border-t border-white/5 pt-3">
                  Pumps, Crops, & Junctions
                </div>
              </div>

              {/* Stat card 2 */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pipeline Edges</span>
                    <span className="text-4xl font-extrabold text-white mt-1 block">{edges.length}</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-purple-400">
                    <Link size={22} />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-4 border-t border-white/5 pt-3">
                  Mesh Density: <span className="text-cyan-400 font-bold font-mono">{analyticsData.density}</span>
                </div>
              </div>

              {/* Stat card 3 */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Shortest Path Cost</span>
                    <span className="text-4xl font-extrabold text-emerald-400 mt-1 block">
                      {simulationMode === 'pathfinding' ? analyticsData.pathDist : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-emerald-400">
                    <Compass size={22} />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-4 border-t border-white/5 pt-3">
                  Source-Destination Path Length
                </div>
              </div>

              {/* Stat card 4 */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Simulation Steps</span>
                    <span className="text-4xl font-extrabold text-amber-500 mt-1 block">
                      {simulationMode === 'pathfinding' ? steps.length : 'Infinite Loop'}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-amber-500">
                    <Sliders size={22} />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-4 border-t border-white/5 pt-3">
                  {simulationMode === 'pathfinding' ? `Runtime: ${activeStep?.runtime || 0} ms` : 'Active Hydraulic simulation'}
                </div>
              </div>
            </div>

            {/* Complexity and reachability detailed cards */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 glass-panel rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Complexity Summary & Correctness Notes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-6 space-y-3">
                    <h4 className="text-sm font-black text-cyan-400 uppercase">Dijkstra's Complexity</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Time Complexity: <span className="text-white font-bold">O((V + E) log V)</span> using a Min-Priority Queue.<br />
                      Space Complexity: <span className="text-white font-bold">O(V)</span> to store distances, parents, and queue states.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Dijkstra maintains correct results by picking the unvisited node with the minimum tentative distance. It assumes non-negative edge weights.
                    </p>
                  </div>

                  <div className="bg-black/50 border border-white/5 rounded-2xl p-6 space-y-3">
                    <h4 className="text-sm font-black text-purple-400 uppercase">Correctness and Relaxation</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      Each step checks if <span className="text-emerald-400">dist[u] + weight(u, v) &lt; dist[v]</span>.<br />
                      If true, the edge relaxes, reducing the path cost and setting u as v's parent.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      For Euclidean paths, A* introduces a heuristic, guiding the frontier search directly towards the target, drastically reducing the search space size.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-6 flex items-start gap-4">
                  <Sparkles className="text-emerald-400 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase">Visualizer Optimizations Enabled</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Our custom SVG engine prevents DOM bottlenecking during grid pathfinding. Steps yield precise history objects to support real-time stepping and backtracking operations. Toggle between Pathfind Mode and Hydraulic Simulation to test real-world mesh routing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reachability chart */}
              <div className="xl:col-span-4 glass-panel rounded-3xl p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Reachability Profile</h3>
                  <span className="text-xs text-zinc-500">Node reachability from source {sourceNodeId === 'AUTO_NEAREST' ? `Auto (${steps[0]?.resolvedSourceId || 'Unresolved'})` : sourceNodeId}</span>
                </div>

                {simulationMode === 'pathfinding' ? (
                  <div className="space-y-6 my-6 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-1.5 font-bold">
                        <span className="text-emerald-400">REACHABLE NODES</span>
                        <span>{analyticsData.reachable} / {nodes.length}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/5">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${(analyticsData.reachable / nodes.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 font-bold">
                        <span className="text-rose-400">UNREACHABLE NODES</span>
                        <span>{analyticsData.unreachable} / {nodes.length}</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-white/5">
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${(analyticsData.unreachable / nodes.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-500 italic">
                    Hydraulic Simulation runs multiple sources. View active nodes in the Editor Canvas or Data Table.
                  </div>
                )}

                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-[10px] text-zinc-500 leading-normal">
                  Toggle the unreachable nodes on the map: they display as static grey or warning red profiles to help engineers locate unlinked components.
                </div>
              </div>
            </div>

            {/* Reservoir Routing & Crop Field Allocation Ledger */}
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Droplet className="text-cyan-400 font-bold" size={20} /> Reservoir Routing & Crop Field Allocation Ledger
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Real-time mapping of crop irrigation zones to their nearest pump station supply reservoirs via Dijkstra's pathfinding solver.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] uppercase text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl">
                    Active Sources: {nodes.filter(n => n.type === 'pump' && n.type !== 'wall').length}
                  </span>
                  <span className="text-[10px] uppercase text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl">
                    Crop Fields: {nodes.filter(n => n.type === 'crop' && n.type !== 'wall').length}
                  </span>
                </div>
              </div>

              {routingLedger.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500 italic bg-black/35 rounded-2xl border border-white/5 font-mono">
                  No crop fields are configured in the current hydraulic layout.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/45">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-white/5 text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                      <tr>
                        <th className="p-4">Crop Zone ID & Name</th>
                        <th className="p-4">Supplying Reservoir</th>
                        <th className="p-4">Hydraulic Distance</th>
                        <th className="p-4">Flow Demand</th>
                        <th className="p-4">Hydration Health</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-400">
                      {routingLedger.map(item => (
                        <tr key={item.cropId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">{item.cropId}</div>
                            <div className="text-[10px] text-zinc-500 font-sans mt-0.5">{item.cropName}</div>
                          </td>
                          <td className="p-4">
                            {item.connected ? (
                              <div>
                                <span className="font-bold text-cyan-400">{item.pumpId}</span>
                                <span className="text-[10px] text-zinc-500 block font-sans">{item.pumpName}</span>
                              </div>
                            ) : (
                              <span className="text-rose-500 font-bold">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-zinc-300">
                            {item.connected ? `${item.distance.toFixed(1)}m` : '∞'}
                          </td>
                          <td className="p-4 font-bold text-amber-500">
                            {item.demand} GPM
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${item.hydration > 70 ? 'text-emerald-400' : item.hydration > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {item.hydration}%
                              </span>
                              <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    item.hydration > 70 ? 'bg-emerald-500' : item.hydration > 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${item.hydration}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {item.connected ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Connected
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                Offline
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: EDITOR CANVAS */}
        {view === 'canvas' && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* TOOLBAR OVERLAY ON TOP OF CANVAS */}
            <div className={`p-4 ${isDark ? 'bg-[#060608]/90 border-white/5' : 'bg-white border-slate-200'} border-b flex flex-wrap gap-4 items-center justify-between shrink-0 relative z-30 shadow-md`}>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Prebuilt and generator controls */}
                <select 
                  onChange={(e) => loadPreset(e.target.value)}
                  className="bg-zinc-900 border border-white/5 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                  defaultValue=""
                >
                  <option value="" disabled>Prebuilt Layouts...</option>
                  <option value="hydraulic">1. Hydraulic Irrigation Grid</option>
                  <option value="complex">2. Dense Multi-Route Grid</option>
                  <option value="directed">3. Directed Flow Ring</option>
                </select>

                <div className="h-6 w-px bg-white/10" />

                <button 
                  onClick={generateRandomGraph}
                  className="px-3 py-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider text-zinc-400 transition-all flex items-center gap-1.5"
                  title="Generate Random Coordinate Network"
                >
                  <Sparkles size={12} /> Random Coordinates
                </button>

                <button 
                  onClick={generateGridMaze}
                  className="px-3 py-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider text-zinc-400 transition-all flex items-center gap-1.5"
                  title="Generate Wall Pathfinding Grid"
                >
                  <Grid size={12} /> Maze Grid
                </button>

                <button 
                  onClick={clearGraph}
                  className="px-3 py-2 bg-rose-950/20 border border-rose-500/10 hover:bg-rose-500 hover:text-black rounded-xl text-xs font-black uppercase tracking-wider text-rose-400 transition-all flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>

              {/* Solver Controls if in pathfinding mode */}
              {simulationMode === 'pathfinding' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-zinc-950/80 border border-white/5 p-1 rounded-xl">
                    {['dijkstra', 'astar', 'bellman', 'bfs', 'dfs'].map(algo => (
                      <button
                        key={algo}
                        onClick={() => { setAlgorithm(algo); addLog(`Switched algorithm to ${algo.toUpperCase()}`, 'info'); }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                          algorithm === algo ? `${activeColor.primaryBg} text-black font-bold` : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {algo}
                      </button>
                    ))}
                  </div>

                  <div className="h-6 w-px bg-white/10" />

                  {/* Node Weight Mode */}
                  <select 
                    value={weightMode}
                    onChange={(e) => setWeightMode(e.target.value)}
                    className="bg-zinc-900 border border-white/5 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono mr-2"
                  >
                    <option value="manual">Manual Weight Mode</option>
                    <option value="euclidean">Euclidean Grid Mode</option>
                    <option value="hydraulic">Hydraulic Cost Formula</option>
                  </select>

                  <div className="h-6 w-px bg-white/10" />

                  {/* Source selector dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Source:</span>
                    <select
                      value={sourceNodeId}
                      onChange={(e) => {
                        setSourceNodeId(e.target.value);
                        addLog(`Selected pathfinding source: ${e.target.value}`, 'info');
                      }}
                      className="bg-zinc-900 border border-white/5 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="AUTO_NEAREST">Auto (Nearest Reservoir)</option>
                      {nodes.filter(n => n.type === 'pump' && n.type !== 'wall').map(n => (
                        <option key={n.id} value={n.id}>{n.id}</option>
                      ))}
                    </select>
                  </div>

                  {/* Destination selector dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Target:</span>
                    <select
                      value={destNodeId}
                      onChange={(e) => {
                        setDestNodeId(e.target.value);
                        addLog(`Selected pathfinding target: ${e.target.value}`, 'info');
                      }}
                      className="bg-zinc-900 border border-white/5 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="" disabled>Select Target Crop...</option>
                      {nodes.filter(n => n.type === 'crop' && n.type !== 'wall').map(n => (
                        <option key={n.id} value={n.id}>{n.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Hydraulic play pause toggle */}
              {simulationMode === 'hydraulic' && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsHydraulicLooping(!isHydraulicLooping)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                      isHydraulicLooping ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500 text-black font-bold'
                    }`}
                  >
                    {isHydraulicLooping ? <Pause size={12} /> : <Play size={12} />}
                    {isHydraulicLooping ? 'Pause Sim Loop' : 'Play Sim Loop'}
                  </button>

                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <RefreshCw size={12} className={isHydraulicLooping ? "animate-spin" : ""} />
                    <span>Active Hydraulic Solves running in background</span>
                  </div>
                </div>
              )}
            </div>

            {/* SIMULATOR STEPS CONTROLLER FOR PATHFINDING */}
            {simulationMode === 'pathfinding' && (
              <div className="bg-zinc-950 px-8 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentStepIdx(0)}
                    disabled={currentStepIdx <= 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all disabled:opacity-30"
                    title="Go to Start"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button 
                    onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentStepIdx <= 0}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all disabled:opacity-30"
                    title="Previous Step"
                  >
                    <ChevronRight className="rotate-180" size={14} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      isPlaying ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'
                    }`}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? 'Pause' : 'Auto-Play'}
                  </button>
                  <button 
                    onClick={() => setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1))}
                    disabled={currentStepIdx >= steps.length - 1}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all disabled:opacity-30"
                    title="Next Step"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
                    title="Reset Search"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                {/* Speed Slider */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Speed:</span>
                    <input 
                      type="range" 
                      min="50" 
                      max="1500" 
                      step="50"
                      value={1550 - playSpeed} // Invert so higher is faster
                      onChange={(e) => setPlaySpeed(1550 - Number(e.target.value))}
                      className="accent-cyan-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer w-24"
                    />
                    <span className="text-[10px] font-mono font-bold text-cyan-400">{(1000 / playSpeed).toFixed(1)}Hz</span>
                  </div>

                  <div className="h-4 w-px bg-white/10" />

                  {/* Step Timeline Indicator */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-zinc-500">Progress:</span>
                    <span className="text-white font-bold">{Math.round((currentStepIdx / Math.max(1, steps.length - 1)) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* DUAL CANVAS AND SIDE PANELS LAYOUT */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* PRIMARY CANVAS VIEWPORT */}
              <div className="flex-1 flex flex-col relative overflow-hidden bg-black blueprint-grid">
                
                {/* TOOLBAR CONTROLLER ON THE CANVAS (Left overlay) */}
                <div className="absolute left-6 top-6 bg-zinc-950/90 border border-white/5 p-2 rounded-2xl grid grid-cols-2 gap-1.5 z-20 shadow-2xl max-h-[calc(100%-48px)] overflow-y-auto scrollbar-thin">
                  {[
                    { id: 'select', icon: MousePointer, tooltip: 'Select & Move' },
                    { id: 'pan', icon: Compass, tooltip: 'Pan Canvas' },
                    { id: 'addPump', icon: PlusCircle, tooltip: 'Add Reservoir Node' },
                    { id: 'addJunction', icon: Wrench, tooltip: 'Add Junction Node' },
                    { id: 'addCrop', icon: Droplet, tooltip: 'Add Crop Node' },
                    { id: 'addEdge', icon: Link, tooltip: 'Add Pipe Routing' },
                    { id: 'wall', icon: Grid, tooltip: 'Draw Grid Walls (Maze)' },
                    { id: 'setSource', icon: MapPin, tooltip: 'Select Source Start' },
                    { id: 'setDest', icon: Flag, tooltip: 'Select Destination End', fullWidth: true }
                  ].map(tool => {
                    const ToolIcon = tool.icon;
                    const isToolActive = activeTool === tool.id;
                    return (
                      <button 
                        key={tool.id}
                        onClick={() => { setActiveTool(tool.id); setConnectingSourceId(null); }}
                        className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
                          isToolActive 
                            ? `${activeColor.primaryBg} text-black font-bold shadow-lg` 
                            : 'bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
                        } ${tool.fullWidth ? 'col-span-2' : ''}`}
                        title={tool.tooltip}
                      >
                        <ToolIcon size={14} />
                      </button>
                    );
                  })}
                </div>

                {/* ZOOM RESET WINDOW CONTROLLER (Right overlay) */}
                <div className="absolute right-6 top-6 bg-zinc-950/90 border border-white/5 p-1.5 rounded-xl flex items-center gap-1 z-20 shadow-2xl font-mono text-[10px]">
                  <button onClick={() => handleZoom(0.85)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><ZoomOut size={13} /></button>
                  <span className="text-zinc-400 font-bold px-2 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button onClick={() => handleZoom(1.15)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><ZoomIn size={13} /></button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button onClick={handleResetZoom} className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg font-black uppercase text-[8px] tracking-wider">Reset</button>
                </div>

                {/* MAIN SVG GRAPH CANVAS */}
                <div 
                  ref={canvasRef}
                  onMouseDown={(e) => {
                    if (activeTool === 'pan' || e.button === 1 || (activeTool === 'select' && !draggingNodeId)) {
                      setIsPanning(true);
                      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
                    }
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                  className={`flex-1 overflow-hidden relative ${
                    activeTool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                  }`}
                >
                  <svg 
                    width="100%" 
                    height="100%" 
                    id="canvas-svg"
                    className="absolute inset-0 overflow-visible"
                  >
                    <rect id="canvas-catch" width="5000" height="5000" x="-2500" y="-2500" fill="transparent" />
                    
                    {/* Viewport transform group */}
                    <g style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                      
                      {/* 1. EDGES / PIPELINES LAYOUT */}
                      {edges.map(edge => {
                        const fromNode = nodes.find(n => n.id === edge.from);
                        const toNode = nodes.find(n => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        // Wall components ignore connectivity
                        if (fromNode.type === 'wall' || toNode.type === 'wall') return null;

                        const isEdgeSelected = selectedEdgeId === edge.id;
                        let flowVal = 0;
                        let headLoss = 0;
                        let isEdgeActive = false;
                        let isShortestPath = false;

                        if (simulationMode === 'pathfinding') {
                          // Find edge state at current step
                          if (activeStep) {
                            isShortestPath = shortestPathEdges.includes(edge.id);
                            isEdgeActive = activeStep.highlightedEdgeId === edge.id;
                            
                            // Check if path is resolved and flow is active
                            const hasDestPath = activeStep.type === 'done' && shortestPathEdges.length > 0;
                            if (hasDestPath && isShortestPath) {
                              flowVal = 300; // Simulated flow down shortest route
                            }
                          }
                        } else {
                          // Hydraulic mode state
                          flowVal = hydraulicHydraulics.flows[edge.id] || 0;
                          headLoss = hydraulicHydraulics.losses[edge.id] || 0;
                          isEdgeActive = flowVal > 0;
                          isShortestPath = flowVal > 0;
                        }

                        // Colors
                        let strokeColor;
                        let strokeWidth;
                        let opacityVal;

                        if (isShortestPath) {
                          strokeColor = '#10b981'; // Green path success
                          strokeWidth = 4.5;
                          opacityVal = 1.0;
                        } else if (isEdgeActive) {
                          strokeColor = activeColor.hex; // Active cyan
                          strokeWidth = 3.5;
                          opacityVal = 1.0;
                        } else {
                          const basePreset = PIPE_PRESETS[edge.pipeType];
                          strokeColor = basePreset?.color || '#52525b';
                          strokeWidth = 2.0;
                          opacityVal = 0.45;
                        }

                        if (isEdgeSelected) {
                          strokeColor = '#6366f1';
                          opacityVal = 1.0;
                        }

                        // Directed arrow markers
                        const dx = toNode.x - fromNode.x;
                        const dy = toNode.y - fromNode.y;
                        const len = Math.hypot(dx, dy);
                        const arrowOffset = 25; // Stop before node radius
                        
                        let targetX = toNode.x;
                        let targetY = toNode.y;
                        if (edge.directed && len > 0) {
                          targetX = toNode.x - (dx / len) * arrowOffset;
                          targetY = toNode.y - (dy / len) * arrowOffset;
                        }

                        return (
                          <g key={edge.id}>
                            {/* Selection ring outline glow */}
                            {isEdgeSelected && (
                              <line 
                                x1={fromNode.x} 
                                y1={fromNode.y} 
                                x2={toNode.x} 
                                y2={toNode.y} 
                                stroke="rgba(99, 102, 241, 0.4)" 
                                strokeWidth="12" 
                                strokeLinecap="round" 
                                className="animate-pulse"
                              />
                            )}

                            {/* Main vector line */}
                            <line 
                              x1={fromNode.x} 
                              y1={fromNode.y} 
                              x2={targetX} 
                              y2={targetY} 
                              stroke={strokeColor} 
                              strokeWidth={strokeWidth} 
                              strokeLinecap="round"
                              opacity={opacityVal}
                              className={flowVal > 0 ? (flowVal > 200 ? "flow-moving-fast" : "flow-moving") : ""}
                            />

                            {/* Arrow markers for directed paths */}
                            {edge.directed && len > 0 && (
                              <g transform={`translate(${targetX}, ${targetY}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`}>
                                <path 
                                  d="M-8,-4 L0,0 L-8,4 Z" 
                                  fill={strokeColor} 
                                  opacity={opacityVal}
                                />
                              </g>
                            )}

                            {/* Click receptor helper bounds */}
                            <line 
                              x1={fromNode.x} 
                              y1={fromNode.y} 
                              x2={toNode.x} 
                              y2={toNode.y} 
                              stroke="transparent" 
                              strokeWidth="16" 
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeTool === 'select') {
                                  setSelectedEdgeId(edge.id);
                                  setSelectedNodeId(null);
                                }
                              }}
                            />

                            {/* Flows stats indicator tag */}
                            {flowVal > 0 && (
                              <g transform={`translate(${(fromNode.x + toNode.x)/2}, ${(fromNode.y + toNode.y)/2 - 12})`}>
                                <rect x="-45" y="-8" width="90" height="15" rx="4" fill="#000" stroke={isShortestPath ? "rgba(16,185,129,0.3)" : "rgba(34,211,238,0.3)"} strokeWidth="1" />
                                <text textAnchor="middle" y="2.5" className="fill-zinc-300 font-mono text-[8px] font-black tracking-wide">
                                  {flowVal} GPM {headLoss > 0 ? `| -${headLoss} PSI` : ''}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* 2. PREVIEW ROUTING GUIDELINE FOR EDGES */}
                      {activeTool === 'addEdge' && connectingSourceId && (
                        (() => {
                          const src = nodes.find(n => n.id === connectingSourceId);
                          if (!src) return null;
                          return (
                            <g>
                              <line 
                                x1={src.x} 
                                y1={src.y} 
                                x2={mouseCanvasPos.x} 
                                y2={mouseCanvasPos.y} 
                                stroke="#6366f1" 
                                strokeWidth="2" 
                                strokeDasharray="5,5" 
                                opacity="0.8" 
                              />
                              <circle 
                                cx={mouseCanvasPos.x} 
                                cy={mouseCanvasPos.y} 
                                r="5" 
                                fill="#6366f1" 
                                className="animate-ping" 
                              />
                            </g>
                          );
                        })()
                      )}

                      {/* 3. NODES & MODULES LAYOUT */}
                      {nodes.map(node => {
                        const isPump = node.type === 'pump';
                        const isCrop = node.type === 'crop';
                        const isWall = node.type === 'wall';
                        
                        const isNodeSelected = selectedNodeId === node.id;
                        const resolvedSourceId = (simulationMode === 'pathfinding' && activeStep?.resolvedSourceId) || sourceNodeId;
                        const isNodeSource = resolvedSourceId === node.id;
                        const isNodeDest = destNodeId === node.id;

                        // Identify algorithm visual states at current step
                        let nodeDist = Infinity;
                        let isVisited = false;
                        let isFrontier = false;
                        let isCurrentNode = false;

                        if (simulationMode === 'pathfinding' && activeStep) {
                          nodeDist = activeStep.distances[node.id];
                          isVisited = activeStep.visited.includes(node.id);
                          isFrontier = activeStep.queue.some(q => q.nodeId === node.id);
                          isCurrentNode = activeStep.currentNodeId === node.id;
                        }

                        // Layout styling variables
                        let strokeColor = 'stroke-zinc-800';
                        let glowClass = '';
                        let innerFill = 'fill-zinc-950';

                        if (isNodeSelected) {
                          strokeColor = 'stroke-indigo-400 stroke-[2.5]';
                          glowClass = 'neon-glow-indigo';
                        } else if (isCurrentNode) {
                          strokeColor = 'stroke-amber-400 stroke-[2.5]';
                          glowClass = 'neon-glow-amber';
                        } else if (isNodeSource) {
                          strokeColor = 'stroke-emerald-400 stroke-[2.5]';
                          glowClass = 'neon-glow-emerald';
                        } else if (isNodeDest) {
                          strokeColor = 'stroke-rose-400 stroke-[2.5]';
                          glowClass = 'neon-glow-rose';
                        } else if (isVisited) {
                          strokeColor = 'stroke-indigo-500/80';
                          innerFill = 'fill-indigo-950/60';
                        } else if (isFrontier) {
                          strokeColor = 'stroke-cyan-500/70';
                          innerFill = 'fill-cyan-950/20';
                        }

                        // Override visual profiles for specific hydraulic components
                        if (simulationMode === 'hydraulic') {
                          if (isPump) {
                            strokeColor = 'stroke-emerald-500/50';
                            glowClass = 'neon-glow-emerald';
                          } else if (isCrop) {
                            strokeColor = node.hydration > 50 ? 'stroke-blue-500/50' : 'stroke-rose-500/50';
                            glowClass = node.hydration > 50 ? 'neon-glow-cyan' : 'neon-glow-rose';
                          }
                        }

                        if (isWall) {
                          strokeColor = 'stroke-zinc-700';
                          innerFill = 'fill-zinc-800';
                        }

                        return (
                          <g 
                            key={node.id} 
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                            onClick={(e) => handleNodeClick(node, e)}
                            className="cursor-pointer"
                          >
                            {/* Visual geometry bases */}
                            {isWall ? (
                              <rect x="-18" y="-18" width="36" height="36" rx="6" className={`${innerFill} ${strokeColor} stroke-2`} />
                            ) : isPump ? (
                              <circle r="22" className={`${innerFill} ${strokeColor} stroke-2 transition-colors`} />
                            ) : isCrop ? (
                              <rect x="-20" y="-20" width="40" height="40" rx="8" className={`${innerFill} ${strokeColor} stroke-2 transition-colors`} />
                            ) : (
                              // Standard junction point
                              <circle r="15" className={`${innerFill} ${strokeColor} stroke-2 transition-colors`} />
                            )}

                            {/* Node glow overlays */}
                            {glowClass && !isWall && (
                              <circle 
                                r={isPump ? 22 : isCrop ? 20 : 15} 
                                className={`fill-transparent stroke-transparent ${glowClass} opacity-60`} 
                              />
                            )}

                            {/* Hydration ripple ping for crops */}
                            {isCrop && node.currentReceived > 0 && (
                              <circle r="6" fill="#3b82f6" className="animate-ping" opacity="0.75" />
                            )}

                            {/* Core icons */}
                            {!isWall && (
                              <g transform="translate(-7, -7)">
                                {isPump ? (
                                  <Sliders size={14} className="text-emerald-400" />
                                ) : isCrop ? (
                                  <Droplet size={14} className={node.hydration > 50 ? "text-cyan-400" : "text-rose-400"} />
                                ) : (
                                  <Compass size={14} className="text-zinc-400" />
                                )}
                              </g>
                            )}

                            {/* Node metadata overlays (Names & values) */}
                            {!isWall && (
                              <>
                                <text 
                                  y="32" 
                                  textAnchor="middle" 
                                  className="fill-zinc-300 font-mono text-[9px] font-black uppercase tracking-wider bg-black"
                                >
                                  {node.id}
                                </text>
                                
                                <text 
                                  y="-26" 
                                  textAnchor="middle" 
                                  className="fill-zinc-500 font-mono text-[8px] font-bold"
                                >
                                  {node.z}m Alt
                                </text>

                                {/* Tentative distances on node */}
                                {simulationMode === 'pathfinding' && nodeDist !== Infinity && (
                                  <g transform="translate(0, -42)">
                                    <rect x="-22" y="-7" width="44" height="13" rx="4" fill="#0c0c0e" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                                    <text textAnchor="middle" y="2" className="fill-yellow-400 font-mono text-[8.5px] font-black">
                                      {nodeDist.toFixed(1)}
                                    </text>
                                  </g>
                                )}
                              </>
                            )}
                          </g>
                        );
                      })}

                    </g>
                  </svg>
                </div>
              </div>

              {/* RIGHT SIDEBAR PANEL - INSPECTOR & ACTIONS */}
              <aside className={`w-80 ${isDark ? 'bg-[#060608]/90 border-white/5' : 'bg-white border-slate-200'} border-l flex flex-col p-6 space-y-6 overflow-y-auto shrink-0 z-20`}>
                
                {/* Save and load graph actions */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={saveGraphJSON} 
                    className="flex-1 py-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    title="Save current layout to local memory"
                  >
                    <Sliders size={12} /> Save
                  </button>
                  <button 
                    onClick={loadGraphJSON} 
                    className="flex-1 py-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    title="Restore layout from memory"
                  >
                    <RefreshCw size={12} /> Restore
                  </button>
                </div>

                <div className="h-px bg-white/5 shrink-0" />

                {/* COMPONENT PROPERTY INSPECTOR */}
                <div className="flex-1 flex flex-col justify-start">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                    Component Property Inspector
                  </h3>

                  {selectedNodeId && nodes.some(n => n.id === selectedNodeId) ? (
                    (() => {
                      const node = nodes.find(n => n.id === selectedNodeId);
                      return (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-black text-white tracking-tight break-all font-mono">
                                {node.id}
                              </h4>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400">
                                {node.type} module
                              </span>
                            </div>
                            <button 
                              onClick={() => deleteNode(node.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-black rounded-xl border border-rose-500/20 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="space-y-4 border-t border-white/5 pt-4 text-xs">
                            {/* Label */}
                            <div className="space-y-1">
                              <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Display Label:</label>
                              <input 
                                type="text"
                                value={node.name}
                                onChange={(e) => updateNodeProperty(node.id, 'name', e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                              />
                            </div>

                            {/* Node Type Selector */}
                            <div className="space-y-1">
                              <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Component Profile Type:</label>
                              <select 
                                value={node.type}
                                onChange={(e) => updateNodeProperty(node.id, 'type', e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 font-mono"
                              >
                                <option value="junction">Pipe Junction Manifold</option>
                                <option value="pump">Pump Station Reservoir</option>
                                <option value="crop">Irrigation Crop field</option>
                                <option value="wall">Grid Wall Blocker</option>
                              </select>
                            </div>

                            {/* Elevation Head (Z) */}
                            <div className="space-y-2">
                              <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Altitude Head Elevation:</label>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => updateNodeProperty(node.id, 'z', Math.max(0, node.z - 1))}
                                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                >
                                  -1m
                                </button>
                                <span className="flex-1 text-center font-mono font-bold text-amber-500 bg-black py-1 rounded-lg border border-white/5">
                                  {node.z} Meters
                                </span>
                                <button 
                                  onClick={() => updateNodeProperty(node.id, 'z', node.z + 1)}
                                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                                >
                                  +1m
                                </button>
                              </div>
                            </div>

                            {/* Type Specific Fields */}
                            {node.type === 'pump' && (
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Max Flow GPM:</label>
                                  <input 
                                    type="number"
                                    value={node.maxFlow || 0}
                                    onChange={(e) => updateNodeProperty(node.id, 'maxFlow', Number(e.target.value))}
                                    className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Pressure PSI:</label>
                                  <input 
                                    type="number"
                                    value={node.pressurePSI || 0}
                                    onChange={(e) => updateNodeProperty(node.id, 'pressurePSI', Number(e.target.value))}
                                    className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 font-mono"
                                  />
                                </div>
                              </div>
                            )}

                            {node.type === 'crop' && (
                              <div className="space-y-3 pt-2">
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Demand GPM:</label>
                                  <input 
                                    type="number"
                                    value={node.flowDemand || 0}
                                    onChange={(e) => updateNodeProperty(node.id, 'flowDemand', Number(e.target.value))}
                                    className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Hydration Health Index:</label>
                                  <div className="w-full bg-zinc-950 p-2 border border-white/5 rounded-lg flex items-center justify-between font-mono">
                                    <span className="text-zinc-500">Decay Index:</span>
                                    <span className={`font-bold ${node.hydration > 50 ? 'text-cyan-400' : 'text-rose-500'}`}>
                                      {node.hydration}%
                                    </span>
                                  </div>
                                </div>

                                {/* Supplying Reservoir info */}
                                {(() => {
                                  const { pumpId, distance } = findNearestPump(nodes, edges, node.id, weightMode, scaleMultiplier);
                                  const pump = nodes.find(n => n.id === pumpId);
                                  return (
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                      <label className="block text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Assigned Reservoir:</label>
                                      <div className="w-full bg-zinc-950/50 p-2 border border-white/5 rounded-lg text-[11px] space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Nearest Source:</span>
                                          <span className={pumpId ? "text-cyan-400 font-bold font-mono" : "text-rose-500 font-bold"}>
                                            {pumpId || "None (Offline)"}
                                          </span>
                                        </div>
                                        {pump && (
                                          <div className="text-[9px] text-zinc-500 truncate leading-none">
                                            {pump.name}
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Path Distance:</span>
                                          <span className="text-zinc-300 font-bold font-mono">
                                            {pumpId && distance !== Infinity ? `${distance.toFixed(1)}m` : "∞"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : selectedEdgeId && edges.some(e => e.id === selectedEdgeId) ? (
                    (() => {
                      const edge = edges.find(e => e.id === selectedEdgeId);
                      return (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-black text-white tracking-tight break-all font-mono">
                                {edge.id}
                              </h4>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400">
                                Pipe Conduit Link
                              </span>
                            </div>
                            <button 
                              onClick={() => deleteEdge(edge.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-black rounded-xl border border-rose-500/20 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="space-y-4 border-t border-white/5 pt-4 text-xs font-mono">
                            <div className="flex justify-between"><span className="text-zinc-500">From Node:</span><span className="text-white font-bold">{edge.from}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">To Node:</span><span className="text-white font-bold">{edge.to}</span></div>

                            {/* Weight value slider */}
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Manual Weight:</label>
                                <span className="text-amber-500 font-bold">{edge.weight}</span>
                              </div>
                              <input 
                                type="range" 
                                min="1" 
                                max="100" 
                                value={edge.weight}
                                onChange={(e) => updateEdgeProperty(edge.id, 'weight', Number(e.target.value))}
                                className="w-full accent-cyan-500 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Pipe presets gauge selection */}
                            <div className="space-y-1">
                              <label className="block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Pipe Capacity Spec:</label>
                              <select 
                                value={edge.pipeType}
                                onChange={(e) => updateEdgeProperty(edge.id, 'pipeType', e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                              >
                                {Object.entries(PIPE_PRESETS).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Directed checkbox toggle */}
                            <div className="flex items-center justify-between bg-black/50 border border-white/5 p-2 rounded-lg">
                              <span className="text-zinc-400 text-xs">Directed flow run:</span>
                              <input 
                                type="checkbox"
                                checked={!!edge.directed}
                                onChange={(e) => updateEdgeProperty(edge.id, 'directed', e.target.checked)}
                                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-zinc-600 text-xs italic py-6 leading-relaxed">
                      Select elements in the graph map workspace, add pipe links, or paint block wall grids to inspect individual properties.
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/5 shrink-0" />

                {/* FILE DOWNLOAD EXPORTS */}
                <div className="space-y-2 shrink-0">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Data File Exports</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={exportJSONFile}
                      className="flex-1 py-2 bg-zinc-950 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download size={11} /> JSON File
                    </button>
                    <button 
                      onClick={exportSVGFile}
                      className="flex-1 py-2 bg-zinc-950 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download size={11} /> SVG Vector
                    </button>
                  </div>
                  
                  {/* JSON Import button */}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={triggerImportJSON}
                      id="json-file-input"
                      className="hidden" 
                    />
                    <label 
                      htmlFor="json-file-input"
                      className="w-full py-2 bg-zinc-900 border border-white/5 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={11} /> Upload JSON Map
                    </label>
                  </div>
                </div>

              </aside>

            </div>

            {/* BOTTOM BAR PANEL - LIVE CONSOLE, PSEUDOCODE AND LOGS */}
            <footer className={`h-60 bg-[#060608]/95 border-t border-white/5 flex overflow-hidden shrink-0 z-20`}>
              
              {/* SECTION A: STEP Walkthrough explanations */}
              <div className="w-1/3 p-6 border-r border-white/5 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2.5">
                    Step Annotation Insights
                  </h3>
                  {simulationMode === 'pathfinding' && activeStep ? (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="text-xs font-bold text-white uppercase tracking-tight">
                        {activeStep.action}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        {activeStep.explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-500 italic">
                      Hydraulic simulation solves loops concurrently. To view individual algorithm steps, toggle the "Pathfind Mode" above.
                    </div>
                  )}
                </div>

                {simulationMode === 'pathfinding' && activeStep && (
                  <div className="text-[9px] font-mono text-zinc-600 bg-zinc-950 p-2 rounded-lg border border-white/5">
                    Step Node: <span className="text-amber-500 font-bold">{activeStep.currentNodeId || 'N/A'}</span> | Visited Count: <span className="text-indigo-400 font-bold">{activeStep.visited.length}</span>
                  </div>
                )}
              </div>

              {/* SECTION B: PSEUDOCODE TRACKER */}
              <div className="w-1/3 p-6 border-r border-white/5 flex flex-col justify-start overflow-y-auto">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2.5">
                  Algorithm Pseudocode Sync
                </h3>
                
                <div className="space-y-1 font-mono text-[10.5px] text-zinc-500">
                  {pseudocodeLines.map((line, idx) => {
                    const isLineActive = simulationMode === 'pathfinding' && activeStep && activeStep.codeLine === idx;
                    return (
                      <div 
                        key={idx}
                        className={`py-0.5 px-2 rounded-md transition-all ${
                          isLineActive 
                            ? 'bg-purple-500/20 text-purple-300 font-black border-l-2 border-purple-500' 
                            : 'hover:text-zinc-400'
                        }`}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION C: TERMINAL LOGS FEED */}
              <div className="w-1/3 p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-center mb-2 shrink-0">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    Live System Telemetry
                  </h3>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-[9px] font-mono font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
                  >
                    Clear logs
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1.5 scrollbar-hide pr-2">
                  {logs.length === 0 ? (
                    <div className="text-zinc-700 italic">Logs terminal clean. Monitor connections or runs here.</div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-zinc-700">[{log.time}]</span>
                        <span className={
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'warning' ? 'text-amber-500' :
                          log.type === 'error' ? 'text-rose-500' : 'text-zinc-500'
                        }>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </footer>

          </div>
        )}

        {/* VIEW 3: DATA SHEET TABLES */}
        {view === 'analysis' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-[1500px]">
            {/* Table A: Nodes list */}
            <div className="glass-panel rounded-3xl p-8 space-y-4">
              <h2 className="text-lg font-black uppercase text-white tracking-wider">Node Elements Matrix Sheet</h2>
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="p-4">Reference ID</th>
                      <th className="p-4">Node Profile Type</th>
                      <th className="p-4">Coordinates (X, Y)</th>
                      <th className="p-4">Elevation (Altitude)</th>
                      <th className="p-4">Dijkstra Solved Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-400">
                    {nodes.map(node => (
                      <tr key={node.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{node.id}</td>
                        <td className="p-4 text-[9px]">
                          <span className={`px-2 py-0.5 rounded font-black uppercase ${
                            node.type === 'pump' ? 'bg-emerald-950 text-emerald-400' : 
                            node.type === 'crop' ? 'bg-blue-950 text-blue-400' : 'bg-purple-950 text-purple-400'
                          }`}>
                            {node.type}
                          </span>
                        </td>
                        <td className="p-4">{node.x}px, {node.y}px</td>
                        <td className="p-4 text-amber-500 font-bold">{node.z} meters</td>
                        <td className="p-4 text-yellow-400 font-bold">
                          {simulationMode === 'pathfinding' && activeStep 
                            ? (activeStep.distances[node.id] === Infinity ? 'Infinity' : activeStep.distances[node.id].toFixed(1))
                            : (node.currentReceived ? `${node.currentReceived} GPM` : '0 GPM')
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table B: Pipeline runs */}
            <div className="glass-panel rounded-3xl p-8 space-y-4">
              <h2 className="text-lg font-black uppercase text-white tracking-wider">Conduit Pipelines Routing Matrix</h2>
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/5 text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                    <tr>
                      <th className="p-4">Pipe Identifier ID</th>
                      <th className="p-4">From Node</th>
                      <th className="p-4">To Node</th>
                      <th className="p-4">Standard Weight</th>
                      <th className="p-4">Pipe Capacity presets</th>
                      <th className="p-4">Topology Directed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-400">
                    {edges.map(edge => (
                      <tr key={edge.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-bold text-white">{edge.id}</td>
                        <td className="p-4">{edge.from}</td>
                        <td className="p-4">{edge.to}</td>
                        <td className="p-4 text-amber-500 font-bold">{edge.weight}</td>
                        <td className="p-4 text-cyan-400 text-[10px]">{edge.pipeType}</td>
                        <td className="p-4 text-[9px] uppercase font-bold text-zinc-500">
                          {edge.directed ? 'True' : 'False'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CONFIGURATION SETTINGS */}
        {view === 'settings' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-[1000px]">
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <h2 className="text-lg font-black uppercase text-white tracking-wider">Simulation Configurations Settings</h2>
              
              <div className="space-y-6">
                
                {/* Accent Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Dashboard Accent Tone:</label>
                  <div className="flex gap-4">
                    {Object.keys(accentColors).map(accentKey => (
                      <button
                        key={accentKey}
                        onClick={() => setThemeAccent(accentKey)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                          themeAccent === accentKey 
                            ? 'bg-zinc-900 border-white/20 text-white font-bold' 
                            : 'bg-black text-zinc-500 border-white/5'
                        }`}
                      >
                        {accentKey} accent
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaling Factor */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Linear Metric Scale Modifier:</label>
                  <div className="flex items-center gap-4 bg-zinc-950 p-4 border border-white/5 rounded-2xl">
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.0" 
                      step="0.5"
                      value={scaleMultiplier}
                      onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                      className="accent-cyan-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer w-48"
                    />
                    <span className="text-sm font-mono font-bold text-cyan-400">{scaleMultiplier}x</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block leading-normal">
                    Adjusts the physical scaling multiplier when calculating Euclidean distances and hydraulic losses between grid nodes.
                  </span>
                </div>

                {/* Infrastructure valuation costs summary */}
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cumulative Valuation Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    {Object.entries(PIPE_PRESETS).map(([key, item]) => {
                      const len = Math.round(bomSummary.lengths[key] || 0);
                      return (
                        <div key={key} className="p-4 bg-black/50 border border-white/5 rounded-xl">
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest mb-1">{item.label}</span>
                          <span className="text-base font-black text-white">{len}m length</span>
                          <span className="block text-[10px] text-zinc-600 mt-1">Cost: ${(len * item.costPerMeter).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-5 bg-gradient-to-r from-zinc-950 to-cyan-950/20 border border-cyan-500/10 rounded-2xl flex justify-between items-center font-mono">
                    <span className="text-xs font-bold text-cyan-400 uppercase">Consolidated valuation projection</span>
                    <span className="text-lg font-black text-white">${bomSummary.cost} USD</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: HELP & DOCUMENTATION */}
        {view === 'help' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-[1200px]">
            <div className="glass-panel rounded-3xl p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-black uppercase text-gradient-cyan">Academic Walkthrough & Keyboard Legends</h2>
                <p className="text-xs text-zinc-500 mt-1">Detailed documentation for engineers and students analyzing the graph solver.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-1.5"><BookOpen size={16} /> Dijkstra</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Dijkstra's algorithm solves the single-source shortest path problem. It maintains tentative distances and repeatedly extracts the node with the absolute minimum distance, relaxing all outgoing connections.
                  </p>
                </div>
                {/* Column 2 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-purple-400 uppercase flex items-center gap-1.5"><Compass size={16} /> A* Search</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A* extends Dijkstra by adding a heuristic estimation <span className="text-yellow-400">f(n) = g(n) + h(n)</span>. It focuses exploration towards the destination node, dramatically reducing the step count in grid maps.
                  </p>
                </div>
                {/* Column 3 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase flex items-center gap-1.5"><Wrench size={16} /> Bellman-Ford</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Bellman-Ford iteratively relaxes all edges in the graph <span className="text-emerald-400">|V| - 1</span> times. While slower than Dijkstra, it supports negative edge weights and identifies negative-cost cycles.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-8 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Keyboard size={16} /> Canvas Editor Tools Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="flex justify-between items-center p-3 bg-black/50 border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Add Node Module</span>
                    <span className="text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5 text-[10px]">Active Add + click canvas</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/50 border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Link Edges Connect</span>
                    <span className="text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5 text-[10px]">Drag or Select Node A and Node B</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/50 border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Erase Selected Component</span>
                    <span className="text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5 text-[10px]">Select item + click Sever/Trash</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/50 border border-white/5 rounded-xl">
                    <span className="text-zinc-400">Scale Canvas Viewport</span>
                    <span className="text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5 text-[10px]">Mouse Scroll wheel / Zoom buttons</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
