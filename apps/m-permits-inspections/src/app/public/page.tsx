/**
 * Public Portal Home Page
 * Landing page with search, FAQ, and resources
 */

'use client';

import {useState} from 'react';
import Link from 'next/link';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Search, FileText, HelpCircle, Calendar, MessageSquare} from 'lucide-react';

export default function PublicPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/public/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Permits & Inspections Portal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Search for permits, view inspection results, and access public information
        </p>

        {/* Quick Search */}
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Input
              placeholder="Search by address, permit number, owner, or parcel"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 text-lg py-6"
            />
            <Button onClick={handleSearch} size="lg" className="px-8">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/public/search">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Permits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Search for permits by address, permit number, owner name, or parcel number
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/public/faq">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                FAQ & Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Find answers to common questions and access educational resources
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/public/calendar">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Public Hearings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View upcoming public hearings, board meetings, and planning sessions
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">What You Can Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                View Permit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track the status of any permit application, view timeline of events, and see
                current processing stage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Access Approved Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View approved plans, inspection results, and other publicly available documents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Submit Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Submit questions, concerns, or comments about public projects and permit
                applications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attend Public Hearings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View calendar of upcoming public hearings, board meetings, and planning
                sessions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
