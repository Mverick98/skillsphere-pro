import { useAssessment } from '@/context/AssessmentContext';
import { Skill } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen } from 'lucide-react';

const SkillSelector = () => {
  const { selectedRole, selectedSkills, toggleSkill, assessmentType } = useAssessment();

  if (!selectedRole) return null;

  const isSkillMode = assessmentType === 'skill';
  const maxSkills = isSkillMode ? 1 : 5;

  const importantSkills = selectedRole.skills.filter(s => s.isImportant);
  const optionalSkills = selectedRole.skills.filter(s => !s.isImportant);

  const isSelected = (skill: Skill) => selectedSkills.some(s => s.id === skill.id);
  const canSelectMore = selectedSkills.length < maxSkills;

  const SkillCard = ({ skill, isImportant }: { skill: Skill; isImportant: boolean }) => {
    const selected = isSelected(skill);
    // In skill mode, always allow clicking (will replace)
    const disabled = !isSkillMode && !selected && !canSelectMore;

    return (
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          selected
            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
            : disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-primary/30 hover:shadow-sm'
        } ${isImportant && !selected ? 'border-primary/20' : ''}`}
        onClick={() => !disabled && toggleSkill(skill)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              disabled={disabled}
              className="mt-0.5"
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={() => toggleSkill(skill)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-foreground">{skill.name}</h4>
                {isImportant && (
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-0 text-xs">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Important
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {skill.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {skill.tasks.length} tasks available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
            2
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {isSkillMode ? 'Select Skill' : 'Select Skills'}
          </h2>
        </div>
        <Badge variant={selectedSkills.length === maxSkills ? 'default' : 'outline'} className="text-sm">
          Selected: {selectedSkills.length}/{maxSkills}
        </Badge>
      </div>

      {isSkillMode && (
        <p className="text-sm text-muted-foreground">
          Select one skill to assess in depth
        </p>
      )}

      {importantSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <span>Important Skills</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {importantSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} isImportant />
            ))}
          </div>
        </div>
      )}

      {optionalSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>Optional Skills</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {optionalSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} isImportant={false} />
            ))}
          </div>
        </div>
      )}

      {!isSkillMode && !canSelectMore && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Maximum 5 skills selected. Deselect one to choose another.
        </p>
      )}
    </div>
  );
};

export default SkillSelector;
