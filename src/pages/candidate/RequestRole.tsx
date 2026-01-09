import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Target, Briefcase, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

interface SkillSearchResult {
  id: string;
  name: string;
  description: string;
  roles: { id: string; name: string }[];
  task_count: number;
}

const ExploreSkills = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState<SkillSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  // Debounced search
  const searchSkills = useCallback(async (query: string) => {
    setIsLoading(true);
    const results = await api.candidate.searchSkills(query);
    setSkills(results);
    setHasSearched(true);
    setIsLoading(false);
  }, []);

  // Initial load - show all skills
  useEffect(() => {
    searchSkills('');
  }, [searchSkills]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSkills(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchSkills]);

  const handleStartAssessment = (skill: SkillSearchResult) => {
    // Navigate to dedicated skill assessment page
    navigate(`/explore-skill/${skill.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Explore Skills</h1>
          <p className="text-muted-foreground">
            Search for any skill and start an assessment
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search skills (e.g., Python, Data Analysis, Machine Learning...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Results */}
      {!isLoading && hasSearched && (
        <>
          {skills.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No skills found</h3>
                <p className="text-muted-foreground">
                  Try a different search term
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {skill.name}
                    </CardTitle>
                    {skill.description && (
                      <CardDescription className="line-clamp-2">
                        {skill.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* Role Tags */}
                    {skill.roles.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Briefcase className="h-3 w-3" />
                          Used in roles:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {skill.roles.map((role) => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Task Count */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                      <ClipboardList className="h-4 w-4" />
                      {skill.task_count} task{skill.task_count !== 1 ? 's' : ''} available
                    </div>

                    {/* Action Button */}
                    <Button
                      className="w-full"
                      onClick={() => handleStartAssessment(skill)}
                      disabled={skill.task_count === 0}
                    >
                      Start Assessment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExploreSkills;
