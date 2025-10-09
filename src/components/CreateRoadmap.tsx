import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, BookOpen, Target, Clock, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Subtask {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  prerequisites: string[];
}

interface CreateRoadmapProps {
  onSuccess?: () => void;
}

export function CreateRoadmap({ onSuccess }: CreateRoadmapProps = {}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    difficulty: "",
    deadline: "",
    tags: [] as string[],
  });

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentSubtask, setCurrentSubtask] = useState({
    title: "",
    description: "",
    estimatedHours: 0,
  });
  const [newTag, setNewTag] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSubtask = () => {
    if (currentSubtask.title && currentSubtask.description) {
      const newSubtask: Subtask = {
        id: Date.now().toString(),
        ...currentSubtask,
        prerequisites: [],
      };
      setSubtasks(prev => [...prev, newSubtask]);
      setCurrentSubtask({ title: "", description: "", estimatedHours: 0 });
      toast("Subtask added successfully!");
    }
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(task => task.id !== id));
  };

  const generateRoadmapWithAI = async () => {
    if (!formData.title || !formData.subject) {
      toast.error("Please enter a title and subject first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('decompose-goal', {
        body: {
          goal: formData.title,
          subject: formData.subject,
          difficulty: formData.difficulty || 'intermediate',
        },
      });

      if (error) throw error;

      if (data?.subtasks && Array.isArray(data.subtasks)) {
        const aiSubtasks: Subtask[] = data.subtasks.map((task: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          title: task.title,
          description: task.description,
          estimatedHours: task.estimated_hours || 0,
          prerequisites: task.prerequisites || [],
        }));

        setSubtasks(aiSubtasks);
        toast.success(`Generated ${aiSubtasks.length} subtasks with AI! 🎉`);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast.error("Failed to generate roadmap. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createRoadmap = async () => {
    if (!formData.title || !formData.subject || subtasks.length === 0) {
      toast("Please fill in all required fields and add at least one subtask");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a roadmap");
        return;
      }

      console.log("Creating roadmap:", { ...formData, subtasks });

      // Insert roadmap
      const { data: roadmap, error: roadmapError } = await supabase
        .from('roadmaps')
        .insert({
          user_id: user.id,
          title: formData.title,
          subject: formData.subject,
          description: formData.description,
          difficulty: formData.difficulty,
          deadline: formData.deadline || null,
          tags: formData.tags,
        })
        .select()
        .single();

      if (roadmapError) throw roadmapError;

      // Insert subtasks
      const subtasksToInsert = subtasks.map(subtask => ({
        roadmap_id: roadmap.id,
        title: subtask.title,
        description: subtask.description,
        estimated_hours: subtask.estimatedHours,
      }));

      const { error: subtasksError } = await supabase
        .from('subtasks')
        .insert(subtasksToInsert);

      if (subtasksError) throw subtasksError;

      toast.success("Roadmap created successfully! 🎉");
      
      // Reset form
      setFormData({
        title: "",
        subject: "",
        description: "",
        difficulty: "",
        deadline: "",
        tags: [],
      });
      setSubtasks([]);
      
      // Call onSuccess callback or navigate to dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Error creating roadmap:", error);
      toast.error("Failed to create roadmap. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Create Learning Roadmap
        </h2>
        <p className="text-muted-foreground">Design your personalized learning journey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Roadmap Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Master React Development"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject/Category *</Label>
              <Input
                id="subject"
                placeholder="e.g., Web Development, Data Science"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your learning goals and what you want to achieve..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deadline">Target Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subtasks */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Learning Subtasks
              </CardTitle>
              <Button
                onClick={generateRoadmapWithAI}
                disabled={isGenerating || !formData.title || !formData.subject}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="Subtask title"
                value={currentSubtask.title}
                onChange={(e) => setCurrentSubtask(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Subtask description"
                value={currentSubtask.description}
                onChange={(e) => setCurrentSubtask(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Estimated hours"
                  value={currentSubtask.estimatedHours}
                  onChange={(e) => setCurrentSubtask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                />
                <Button onClick={addSubtask} className="bg-primary hover:bg-primary-hover">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{index + 1}. {subtask.title}</h4>
                      <p className="text-sm text-muted-foreground">{subtask.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{subtask.estimatedHours}h</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubtask(subtask.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-center">
        <Button 
          onClick={createRoadmap}
          size="lg"
          className="bg-gradient-primary text-primary-foreground px-8 py-3 shadow-orange hover:shadow-lg transition-all"
        >
          <Target className="h-5 w-5 mr-2" />
          Create Roadmap
        </Button>
      </div>
    </div>
  );
}