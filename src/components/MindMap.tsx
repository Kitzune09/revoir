import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Custom node component for roadmap tasks
function TaskNode({ data }: { data: any }) {
  const { title, description, completed, estimatedHours, difficulty } = data;
  
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'hard': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border-2 bg-gradient-card min-w-[200px] max-w-[250px] shadow-md transition-all hover:shadow-lg",
      completed ? "border-success bg-success/10" : "border-border hover:border-primary"
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-2 border-background" />
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground leading-tight">{title}</h3>
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge className={getDifficultyColor(difficulty)}>
            {difficulty}
          </Badge>
          
          {estimatedHours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {estimatedHours}h
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-2 border-background" />
    </div>
  );
}

// Custom node component for the main goal
function GoalNode({ data }: { data: any }) {
  return (
    <div className="p-6 rounded-xl bg-gradient-primary text-primary-foreground min-w-[250px] shadow-lg">
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-background border-2 border-primary-foreground" />
      
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">{data.title}</h2>
        <p className="text-sm opacity-90">{data.subject}</p>
        {data.progress !== undefined && (
          <div className="text-sm font-medium">
            Progress: {data.progress}%
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  task: TaskNode,
  goal: GoalNode,
};

export function MindMap() {
  // Sample roadmap data - in real app this would come from props or state
  const initialNodes: Node[] = [
    {
      id: 'goal',
      type: 'goal',
      position: { x: 400, y: 50 },
      data: { 
        title: 'Complete React Mastery',
        subject: 'React Development',
        progress: 65
      },
      draggable: false,
    },
    {
      id: 'task-1',
      type: 'task',
      position: { x: 100, y: 200 },
      data: {
        title: 'Learn React Fundamentals',
        description: 'Understand components, props, and state',
        completed: true,
        estimatedHours: 20,
        difficulty: 'easy'
      },
    },
    {
      id: 'task-2', 
      type: 'task',
      position: { x: 350, y: 200 },
      data: {
        title: 'Master React Hooks',
        description: 'useState, useEffect, useContext, custom hooks',
        completed: true,
        estimatedHours: 15,
        difficulty: 'medium'
      },
    },
    {
      id: 'task-3',
      type: 'task', 
      position: { x: 600, y: 200 },
      data: {
        title: 'State Management',
        description: 'Learn Redux, Zustand, or Context API patterns',
        completed: false,
        estimatedHours: 25,
        difficulty: 'hard'
      },
    },
    {
      id: 'task-4',
      type: 'task',
      position: { x: 225, y: 350 },
      data: {
        title: 'React Router',
        description: 'Navigation and routing in React apps',
        completed: false,
        estimatedHours: 10,
        difficulty: 'medium'
      },
    },
    {
      id: 'task-5',
      type: 'task',
      position: { x: 475, y: 350 },
      data: {
        title: 'Testing React Apps',
        description: 'Jest, React Testing Library, E2E tests',
        completed: false,
        estimatedHours: 20,
        difficulty: 'hard'
      },
    },
    {
      id: 'task-6',
      type: 'task',
      position: { x: 350, y: 500 },
      data: {
        title: 'Build Portfolio Project',
        description: 'Create a full-stack React application',
        completed: false,
        estimatedHours: 40,
        difficulty: 'hard'
      },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'goal-task1', source: 'goal', target: 'task-1', type: 'smoothstep' },
    { id: 'goal-task2', source: 'goal', target: 'task-2', type: 'smoothstep' },
    { id: 'goal-task3', source: 'goal', target: 'task-3', type: 'smoothstep' },
    { id: 'task1-task4', source: 'task-1', target: 'task-4', type: 'smoothstep' },
    { id: 'task2-task4', source: 'task-2', target: 'task-4', type: 'smoothstep' },
    { id: 'task3-task5', source: 'task-3', target: 'task-5', type: 'smoothstep' },
    { id: 'task4-task6', source: 'task-4', target: 'task-6', type: 'smoothstep' },
    { id: 'task5-task6', source: 'task-5', target: 'task-6', type: 'smoothstep' },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[600px] w-full rounded-lg border border-border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/10"
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: 'hsl(var(--primary))' },
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20,
            color: 'hsl(var(--primary))',
          },
        }}
      >
        <Controls className="bg-card border border-border" />
        <MiniMap 
          className="bg-card border border-border"
          nodeColor={(node) => {
            if (node.type === 'goal') return 'hsl(var(--primary))';
            return node.data.completed ? 'hsl(var(--success))' : 'hsl(var(--muted))';
          }}
        />
        <Background color="hsl(var(--muted-foreground))" gap={20} />
      </ReactFlow>
    </div>
  );
}