import { useAssessment } from '@/context/AssessmentContext';
import { Skill, Task, Complexity } from '@/data/mockData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';

const ComplexityBadge = ({ complexity }: { complexity: Complexity }) => {
  const config = {
    HC: { label: 'HC', className: 'complexity-badge complexity-high' },
    MC: { label: 'MC', className: 'complexity-badge complexity-medium' },
    LC: { label: 'LC', className: 'complexity-badge complexity-low' },
  };

  return (
    <span className={config[complexity].className}>
      [{config[complexity].label}]
    </span>
  );
};

const TaskSelector = () => {
  const { selectedSkills, selectedTasks, toggleTask, selectAllTasks, deselectAllTasks } = useAssessment();

  if (selectedSkills.length === 0) return null;

  const getSelectedTasksForSkill = (skillId: string) => {
    return selectedTasks.filter(t => t.skillId === skillId);
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(t => t.taskId === taskId);
  };

  const areAllTasksSelected = (skill: Skill) => {
    return skill.tasks.every(t => isTaskSelected(t.id));
  };

  return (
    <div id="task-selector" className="space-y-4 animate-fade-in scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
          3
        </div>
        <h2 className="text-lg font-semibold text-foreground">Select Tasks per Skill</h2>
      </div>

      <Accordion type="multiple" defaultValue={selectedSkills.map(s => s.id)} className="space-y-3">
        {selectedSkills.map(skill => {
          const selectedCount = getSelectedTasksForSkill(skill.id).length;
          const allSelected = areAllTasksSelected(skill);

          return (
            <AccordionItem
              key={skill.id}
              value={skill.id}
              className="border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}/{skill.tasks.length} tasks
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => allSelected ? deselectAllTasks(skill.id) : selectAllTasks(skill)}
                      className="text-xs h-8"
                    >
                      {allSelected ? (
                        <>
                          <Square className="w-3 h-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {skill.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isTaskSelected(task.id)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/30 hover:bg-muted/30'
                        }`}
                        onClick={() => toggleTask(skill.id, task)}
                      >
                        <Checkbox
                          checked={isTaskSelected(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleTask(skill.id, task)}
                        />
                        <span className="flex-1 text-sm">{task.name}</span>
                        <ComplexityBadge complexity={task.complexity} />
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default TaskSelector;
