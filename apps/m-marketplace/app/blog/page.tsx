import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Clock, User, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Industry insights, platform updates, and best practices from the Kealee team.',
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

export default function BlogPage() {
  const categories = [
    { name: 'All', slug: 'all' },
    { name: 'Industry Insights', slug: 'industry-insights' },
    { name: 'Product Updates', slug: 'product-updates' },
    { name: 'Permits & Compliance', slug: 'permits-compliance' },
    { name: 'Best Practices', slug: 'best-practices' },
  ];

  const posts: BlogPost[] = [
    {
      slug: 'ai-permit-review-how-it-works',
      title: 'How AI Permit Review Works: A Deep Dive into Our Technology',
      excerpt: 'Learn how our AI analyzes permit documents in minutes, catching common errors and improving first-try approval rates to 85%.',
      author: 'Tim Chamberlain',
      date: 'January 20, 2025',
      readTime: '8 min read',
      category: 'Product Updates',
      featured: true,
    },
    {
      slug: '2025-dc-building-code-changes',
      title: '2025 DC Building Code Changes: What Contractors Need to Know',
      excerpt: 'The District of Columbia has updated several key building codes for 2025. Here\'s a comprehensive guide to the changes affecting your projects.',
      author: 'Sarah Martinez',
      date: 'January 15, 2025',
      readTime: '12 min read',
      category: 'Permits & Compliance',
      featured: true,
    },
    {
      slug: 'reducing-permit-delays',
      title: '5 Strategies to Reduce Permit Delays on Your Next Project',
      excerpt: 'Permit delays can add weeks to your timeline. Here are proven strategies from our permit specialists to keep your projects on track.',
      author: 'Michael Chen',
      date: 'January 10, 2025',
      readTime: '6 min read',
      category: 'Best Practices',
    },
    {
      slug: 'building-tech-trends-2025',
      title: 'Building Tech Trends to Watch in 2025',
      excerpt: 'From AI-powered project management to drone inspections, here are the technology trends reshaping the building industry this year.',
      author: 'Tim Chamberlain',
      date: 'January 5, 2025',
      readTime: '10 min read',
      category: 'Industry Insights',
    },
    {
      slug: 'owner-portal-launch',
      title: 'Introducing the Project Owner Portal: Real-Time Visibility for Your Clients',
      excerpt: 'Give your clients the transparency they crave. Our new Owner Portal reduces status update calls by 90% while improving satisfaction.',
      author: 'Emily Wong',
      date: 'December 28, 2024',
      readTime: '5 min read',
      category: 'Product Updates',
    },
    {
      slug: 'managing-subcontractors-efficiently',
      title: 'Managing Subcontractors More Efficiently: A GC\'s Guide',
      excerpt: 'Subcontractor coordination is one of the biggest challenges for general contractors. Here\'s how to streamline communication and reduce conflicts.',
      author: 'David Rodriguez',
      date: 'December 20, 2024',
      readTime: '7 min read',
      category: 'Best Practices',
    },
    {
      slug: 'baltimore-permit-process-guide',
      title: 'The Complete Guide to Baltimore\'s Permit Process',
      excerpt: 'Navigating Baltimore\'s permitting system can be challenging. This guide covers everything from application to inspection.',
      author: 'Sarah Martinez',
      date: 'December 15, 2024',
      readTime: '15 min read',
      category: 'Permits & Compliance',
    },
    {
      slug: 'cost-estimation-tips',
      title: '10 Tips for More Accurate Cost Estimation',
      excerpt: 'Accurate estimates win bids and protect margins. Our estimation experts share their top tips for getting it right.',
      author: 'James Wilson',
      date: 'December 10, 2024',
      readTime: '9 min read',
      category: 'Best Practices',
    },
  ];

  const featuredPosts = posts.filter(p => p.featured);
  const regularPosts = posts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">

          {/* Hero */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Kealee Blog
            </h1>
            <p className="text-xl text-gray-600">
              Industry insights, platform updates, and best practices from our team.
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  cat.slug === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <article
                    key={post.slug}
                    className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 overflow-hidden hover:border-blue-300 hover:shadow-xl transition group"
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock size={14} />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                            {post.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{post.author}</div>
                            <div className="text-sm text-gray-500">{post.date}</div>
                          </div>
                        </div>
                        <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read More <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* All Posts */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article
                  key={post.slug}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                        {post.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{post.author}</div>
                        <div className="text-xs text-gray-500">{post.date}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-20 bg-blue-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Get the latest industry insights and Kealee updates delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition"
              >
                Subscribe
              </button>
            </form>
            <p className="text-blue-200 text-sm mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
