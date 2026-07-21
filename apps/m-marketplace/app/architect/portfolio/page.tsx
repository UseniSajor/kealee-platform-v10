'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Building2, Home, Store, Heart, GraduationCap, Warehouse, Filter, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  location: string;
  size: string;
  description: string;
  services: string[];
  image: string;
}

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Projects', icon: Building2 },
    { id: 'commercial', label: 'Commercial', icon: Building2 },
    { id: 'residential', label: 'Residential', icon: Home },
    { id: 'retail', label: 'Retail', icon: Store },
    { id: 'healthcare', label: 'Healthcare', icon: Heart },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'industrial', label: 'Industrial', icon: Warehouse },
  ];

  const projects: Project[] = [
    {
      id: '1',
      title: 'Downtown Office Tower',
      category: 'commercial',
      location: 'Washington, DC',
      size: '250,000 SF',
      description: 'A modern 15-story office building featuring sustainable design, LEED Gold certification, and a rooftop amenity deck with panoramic city views.',
      services: ['Schematic Design', 'Design Development', 'Construction Documents', 'Permit Drawings'],
      image: '/images/portfolio/office-tower.jpg',
    },
    {
      id: '2',
      title: 'Luxury Residential Complex',
      category: 'residential',
      location: 'Arlington, VA',
      size: '180 Units',
      description: 'High-end multifamily development with resort-style amenities, underground parking, and efficient unit layouts maximizing natural light.',
      services: ['Full Architecture', 'Interior Design', '3D Renderings'],
      image: '/images/portfolio/residential-complex.jpg',
    },
    {
      id: '3',
      title: 'Medical Office Building',
      category: 'healthcare',
      location: 'Bethesda, MD',
      size: '75,000 SF',
      description: 'State-of-the-art medical office building designed for flexibility, with specialized MEP systems and efficient patient flow.',
      services: ['Schematic Design', 'Construction Documents', 'Medical Planning'],
      image: '/images/portfolio/medical-building.jpg',
    },
    {
      id: '4',
      title: 'Retail Shopping Center',
      category: 'retail',
      location: 'Baltimore, MD',
      size: '120,000 SF',
      description: 'Mixed-use retail center featuring anchor tenant spaces, inline shops, and a central gathering plaza with outdoor seating.',
      services: ['Design Development', 'Tenant Coordination', 'Permit Drawings'],
      image: '/images/portfolio/retail-center.jpg',
    },
    {
      id: '5',
      title: 'University Science Building',
      category: 'education',
      location: 'College Park, MD',
      size: '95,000 SF',
      description: 'Advanced research and teaching facility with specialized laboratory spaces, collaborative areas, and cutting-edge sustainability features.',
      services: ['Full Architecture', 'Lab Planning', 'BIM Modeling'],
      image: '/images/portfolio/science-building.jpg',
    },
    {
      id: '6',
      title: 'Custom Home Renovation',
      category: 'residential',
      location: 'Georgetown, DC',
      size: '4,500 SF',
      description: 'Historic rowhouse renovation blending modern amenities with preserved architectural details, including a new rear addition.',
      services: ['Schematic Design', 'Historic Review', 'Construction Documents'],
      image: '/images/portfolio/home-renovation.jpg',
    },
    {
      id: '7',
      title: 'Distribution Center',
      category: 'industrial',
      location: 'Manassas, VA',
      size: '350,000 SF',
      description: 'Modern logistics facility with high-bay warehousing, efficient loading docks, and office space for operations management.',
      services: ['Design Development', 'Construction Documents'],
      image: '/images/portfolio/distribution-center.jpg',
    },
    {
      id: '8',
      title: 'Outpatient Surgery Center',
      category: 'healthcare',
      location: 'Fairfax, VA',
      size: '28,000 SF',
      description: 'Purpose-built ambulatory surgery center with operating suites, recovery areas, and patient-centered design elements.',
      services: ['Full Architecture', 'Medical Equipment Planning'],
      image: '/images/portfolio/surgery-center.jpg',
    },
  ];

  const categoryImages: Record<string, string> = {
    residential: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop',
    commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&auto=format&fit=crop',
    retail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&auto=format&fit=crop',
  };

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Explore our completed projects across commercial, residential, healthcare, and more.
            Each project showcases our commitment to thoughtful design and client collaboration.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition group"
            >
              {/* Project Image */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {categoryImages[project.category] ? (
                  <Image
                    src={categoryImages[project.category]}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Building2 className="text-blue-400" size={64} />
                  </div>
                )}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur text-sm font-medium text-gray-700 rounded-full capitalize">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {project.location} • {project.size}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.services.slice(0, 3).map((service, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="text-gray-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No projects in this category</h3>
            <p className="text-gray-600">Try selecting a different category.</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our team of licensed architects is ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/architect/quote"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
            >
              Get a Quote
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/architect/projects/new"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 transition"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
