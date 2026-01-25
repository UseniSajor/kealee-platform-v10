'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@kealee/auth';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { PMClient } from '@/lib/types';
import {
  Search,
  Plus,
  Building,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Archive,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const { user } = useRequireAuth();
  const [clients, setClients] = useState<PMClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadClients();
  }, [search, filter]);

  const loadClients = async () => {
    try {
      const query: any = {};
      if (filter === 'active') query.active = true;
      if (filter === 'inactive') query.active = false;
      
      const data = await api.getMyClients(query);
      let filtered = data.clients || [];
      
      // Apply search filter
      if (search) {
        filtered = filtered.filter((c: PMClient) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setClients(filtered);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Clients
          </h1>
          <p className="text-gray-600">
            {clients.length} clients assigned to you
          </p>
        </div>

        <Link
          href="/clients/assign"
          className="
            flex items-center gap-2
            px-6 py-3
            bg-blue-600 hover:bg-blue-700
            text-white font-semibold
            rounded-lg
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
        >
          <Plus size={20} />
          Request Assignment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-4 py-3
                border-2 border-gray-300 rounded-lg
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                transition-all duration-200
              "
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-medium
                  transition-all duration-200
                  ${filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Total Clients"
          value={clients.length}
          icon={Building}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={clients.reduce((sum: number, c: PMClient) => sum + (c.activeProjects || 0), 0)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Open Tasks"
          value={clients.reduce((sum: number, c: PMClient) => sum + (c.openTasks || 0), 0)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Building className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No clients found
          </h3>
          <p className="text-gray-600 mb-6">
            {search ? 'Try adjusting your search' : 'No clients assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: PMClient) => (
            <ClientCard key={client.id} client={client} onUpdate={loadClients} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: 'blue' | 'green' | 'purple' }) {
  const colors: Record<'blue' | 'green' | 'purple', string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-gray-600">
        {title}
      </div>
    </div>
  );
}

function ClientCard({ client, onUpdate }: { client: PMClient; onUpdate: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="
            w-12 h-12
            bg-blue-100 text-blue-600
            rounded-full
            flex items-center justify-center
            font-bold text-lg
          ">
            {client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{client.name}</h3>
            <span className={`
              inline-block px-2 py-1 mt-1
              rounded-full text-xs font-medium
              ${client.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
              }
            `}>
              {client.status}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="
              w-8 h-8
              text-gray-600 hover:text-gray-900
              hover:bg-gray-100
              rounded-full
              flex items-center justify-center
            "
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="
                absolute right-0 mt-2
                bg-white
                border-2 border-gray-200 rounded-lg
                shadow-xl
                w-48
                z-20
              ">
                <button className="
                  w-full px-4 py-2
                  text-left text-sm
                  hover:bg-gray-50
                  flex items-center gap-2
                ">
                  <Edit size={16} />
                  Edit Client
                </button>
                <button className="
                  w-full px-4 py-2
                  text-left text-sm text-red-600
                  hover:bg-red-50
                  flex items-center gap-2
                ">
                  <Archive size={16} />
                  Archive Client
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4 text-sm">
        {client.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={16} />
            <a href={`mailto:${client.email}`} className="hover:text-blue-600">
              {client.email}
            </a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={16} />
            <a href={`tel:${client.phone}`} className="hover:text-blue-600">
              {client.phone}
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {client.activeProjects || 0}
          </div>
          <div className="text-xs text-gray-600">Active Projects</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            ${(client.packagePrice || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Package Price</div>
        </div>
      </div>

      {/* View Details */}
      <Link
        href={`/clients/${client.id}`}
        className="
          w-full mt-4 py-3
          bg-blue-50 hover:bg-blue-100
          text-blue-600 font-semibold
          rounded-lg
          transition-all duration-200
          flex items-center justify-center
        "
      >
        View Details →
      </Link>
    </div>
  );
}
