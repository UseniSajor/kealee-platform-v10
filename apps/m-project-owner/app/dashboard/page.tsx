'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Calendar, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@kealee/ui';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch projects
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/projects');
      // const data = await response.json();
      // setProjects(data);
      setProjects([]); // Empty for now
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>

            {/* PRIMARY CTA - Most prominent element */}
            <Link
              href="/projects/new"
              className="
                flex items-center gap-2
                px-6 py-3
                bg-primary-600 hover:bg-primary-700
                text-white font-semibold
                rounded-lg
                shadow-md hover:shadow-lg
                transition-all duration-200
                transform hover:scale-105
              "
            >
              <Plus size={20} />
              Create Project
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectList projects={projects} />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Illustration/Icon */}
      <div className="
        w-32 h-32 mx-auto mb-6
        bg-primary-100 rounded-full
        flex items-center justify-center
      ">
        <FolderOpen className="text-primary-600" size={64} />
      </div>

      {/* Headline */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Start Your First Project
      </h2>

      {/* Description */}
      <p className="text-lg text-gray-600 mb-8">
        Track milestones, manage contractors, and approve payments all in one place.
        Creating a project takes less than 2 minutes.
      </p>

      {/* CTA */}
      <Link
        href="/projects/new"
        className="
          inline-flex items-center gap-2
          px-8 py-4
          bg-primary-600 hover:bg-primary-700
          text-white text-lg font-semibold
          rounded-lg
          shadow-lg hover:shadow-xl
          transition-all duration-200
        "
      >
        <Plus size={24} />
        Create Your First Project
      </Link>

      {/* Social Proof */}
      <p className="mt-6 text-sm text-gray-500">
        Join 500+ project owners using Kealee
      </p>
    </div>
  );
}

function ProjectList({ projects }: { projects: any[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} variant="interactive" hover>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600">{project.location}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{project.timeline}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={16} />
                <span>{project.budget}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {project.contractorCount || 0} contractors
                </span>
              </div>
              <Link
                href={`/projects/${project.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                View →
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
