import { useCallback, useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch all roadmaps
  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: roadmapsData, error } = await supabase
        .from('roadmaps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRoadmaps(roadmapsData || []);
      if (roadmapsData && roadmapsData.length > 0) {
        setSelectedRoadmapId(roadmapsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast.error("Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  };

  // Fetch subtasks and build graph when roadmap is selected
  useEffect(() => {
    if (selectedRoadmapId) {
      loadRoadmapGraph(selectedRoadmapId);
    }
  }, [selectedRoadmapId]);

  const loadRoadmapGraph = async (roadmapId: string) => {
    try {
      // Fetch roadmap details
      const { data: roadmap, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();

      if (roadmapError) throw roadmapError;

      // Fetch subtasks
      const { data: subtasks, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('roadmap_id', roadmapId);

      if (subtasksError) throw subtasksError;

      // Calculate progress
      const totalTasks = subtasks?.length || 0;
      const completedTasks = subtasks?.filter(st => st.completed).length || 0;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Build nodes
      const newNodes: Node[] = [
        {
          id: 'goal',
          type: 'goal',
          position: { x: 400, y: 50 },
          data: { 
            title: roadmap.title,
            subject: roadmap.subject,
            progress: progress
          },
          draggable: false,
        },
      ];

      // Add subtask nodes
      const tasksPerRow = 3;
      subtasks?.forEach((subtask, index) => {
        const row = Math.floor(index / tasksPerRow);
        const col = index % tasksPerRow;
        const xOffset = 300;
        const yOffset = 200;
        
        newNodes.push({
          id: `task-${subtask.id}`,
          type: 'task',
          position: { 
            x: xOffset * col + 100, 
            y: yOffset * (row + 1)
          },
          data: {
            title: subtask.title,
            description: subtask.description,
            completed: subtask.completed,
            estimatedHours: subtask.estimated_hours,
            difficulty: roadmap.difficulty
          },
        });
      });

      // Build edges
      const newEdges: Edge[] = subtasks?.map((subtask) => ({
        id: `goal-task-${subtask.id}`,
        source: 'goal',
        target: `task-${subtask.id}`,
        type: 'smoothstep',
      })) || [];

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error("Error loading roadmap graph:", error);
      toast.error("Failed to load roadmap visualization");
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return (
      <div className="h-[600px] w-full rounded-lg border border-border bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading roadmaps...</p>
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="h-[600px] w-full rounded-lg border border-border bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No roadmaps yet. Create your first roadmap to see it visualized here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Select Roadmap:</label>
        <Select value={selectedRoadmapId || ''} onValueChange={setSelectedRoadmapId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a roadmap" />
          </SelectTrigger>
          <SelectContent>
            {roadmaps.map((roadmap) => (
              <SelectItem key={roadmap.id} value={roadmap.id}>
                {roadmap.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
    </div>
  );
}