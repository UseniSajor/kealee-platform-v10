// ============================================================
// COMMENT LIBRARY - Jurisdiction-specific templates
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy } from 'lucide-react';

interface CommentTemplate {
  id: string;
  title: string;
  text: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  discipline: string;
  codeReference?: string;
  jurisdictionId: string;
  usageCount: number;
}

interface CommentLibraryProps {
  jurisdictionId: string;
  discipline: string;
  onSelectComment: (comment: CommentTemplate) => void;
}

export function CommentLibrary({
  jurisdictionId,
  discipline,
  onSelectComment,
}: CommentLibraryProps) {
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, [jurisdictionId, discipline]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        `/api/comments/templates?jurisdictionId=${jurisdictionId}&discipline=${discipline}`
      );
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (template: CommentTemplate) => {
    navigator.clipboard.writeText(template.text);
    onSelectComment(template);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No templates found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                // Open create template dialog
                console.log('Create new template');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{template.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge
                        variant={
                          template.severity === 'critical'
                            ? 'destructive'
                            : template.severity === 'major'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {template.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.text}
                    </p>
                    {template.codeReference && (
                      <p className="text-xs text-muted-foreground">
                        Code: {template.codeReference}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Used {template.usageCount} times
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(template)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
