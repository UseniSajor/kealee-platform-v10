'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Send to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSent(true);
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          message: '',
        });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      alert('Failed to send message. Please try again or email us directly at contact@kealee.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h1>
              <p className="text-xl text-gray-600">
                Have questions? We'd love to hear from you.
              </p>
            </div>

            {sent ? (
              <div className="max-w-2xl mx-auto bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Message Sent!
                </h2>
                <p className="text-gray-600 mb-6">
                  We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-12">
                
                {/* Contact Info */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Contact Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Email</div>
                          <a href="mailto:contact@kealee.com" className="text-blue-600 hover:text-blue-700">
                            contact@kealee.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Phone</div>
                          <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-700">
                            (123) 456-7890
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="text-blue-600" size={24} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">Office</div>
                          <p className="text-gray-600">
                            Washington, DC<br />
                            Baltimore, MD
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Business Hours
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="font-semibold">9am - 6pm EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="font-semibold">10am - 2pm EST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="font-semibold">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Send us a Message
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="
                              w-full px-4 py-3
                              border-2 border-gray-300 rounded-lg
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                              transition-all duration-200
                            "
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="
                              w-full px-4 py-3
                              border-2 border-gray-300 rounded-lg
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                              transition-all duration-200
                            "
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                            className="
                              w-full px-4 py-3
                              border-2 border-gray-300 rounded-lg
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                              transition-all duration-200
                            "
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="
                              w-full px-4 py-3
                              border-2 border-gray-300 rounded-lg
                              focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                              transition-all duration-200
                            "
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          required
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({...formData, message: e.target.value})}
                          placeholder="Tell us about your project or question..."
                          className="
                            w-full px-4 py-3
                            border-2 border-gray-300 rounded-lg
                            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                            transition-all duration-200
                            resize-none
                          "
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sending}
                        className="
                          w-full py-4
                          bg-blue-600 hover:bg-blue-700
                          text-white font-semibold text-lg
                          rounded-lg
                          shadow-lg hover:shadow-xl
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                          flex items-center justify-center gap-2
                        "
                      >
                        {sending ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Send Message
                          </>
                        )}
                      </button>

                      <p className="text-sm text-gray-600 text-center">
                        We typically respond within 24 hours
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}




