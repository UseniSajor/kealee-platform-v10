'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Plus, X, Users, Send, Loader2, CheckCircle } from 'lucide-react';

interface Invitation {
  email: string;
  role: 'contractor' | 'subcontractor' | 'viewer';
  sent: boolean;
}

export default function InviteContractorsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([
    { email: '', role: 'contractor', sent: false },
  ]);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const addInvitation = () => {
    setInvitations([...invitations, { email: '', role: 'contractor', sent: false }]);
  };

  const removeInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations(invitations.filter((_, i) => i !== index));
    }
  };

  const updateInvitation = (index: number, field: keyof Invitation, value: string) => {
    const updated = [...invitations];
    updated[index] = { ...updated[index], [field]: value };
    setInvitations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate sending invitations
    await new Promise(resolve => setTimeout(resolve, 2000));

    const validInvites = invitations.filter(inv => inv.email.trim());
    setSentCount(validInvites.length);
    setInvitations(invitations.map(inv => ({ ...inv, sent: !!inv.email.trim() })));
    setSending(false);
  };

  const allSent = invitations.every(inv => inv.sent || !inv.email.trim());

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back Link */}
        <Link
          href="/owner/dashboard"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invite Contractors
          </h1>
          <p className="text-gray-600">
            Invite contractors and team members to collaborate on your projects
          </p>
        </div>

        {/* Success Message */}
        {sentCount > 0 && allSent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-green-800">
                {sentCount} invitation{sentCount > 1 ? 's' : ''} sent successfully!
              </p>
              <p className="text-sm text-green-600">
                They will receive an email to join your project.
              </p>
            </div>
          </div>
        )}

        {/* Invitation Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>

            <div className="space-y-4 mb-6">
              {invitations.map((invitation, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition ${
                    invitation.sent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="email"
                          value={invitation.email}
                          onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                          placeholder="contractor@example.com"
                          disabled={invitation.sent}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={invitation.role}
                        onChange={(e) => updateInvitation(index, 'role', e.target.value)}
                        disabled={invitation.sent}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                      >
                        <option value="contractor">General Contractor</option>
                        <option value="subcontractor">Subcontractor</option>
                        <option value="viewer">Viewer Only</option>
                      </select>
                    </div>
                  </div>

                  {invitation.sent ? (
                    <div className="flex items-center gap-2 text-green-600 pt-6">
                      <CheckCircle size={20} />
                      <span className="text-sm font-medium">Sent</span>
                    </div>
                  ) : (
                    invitations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvitation(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition mt-6"
                      >
                        <X size={20} />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>

            {/* Add Another */}
            {!allSent && (
              <button
                type="button"
                onClick={addInvitation}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2 mb-6"
              >
                <Plus size={20} />
                Add Another Invitation
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || allSent}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending Invitations...
                </>
              ) : allSent ? (
                <>
                  <CheckCircle size={20} />
                  All Invitations Sent
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Invitations
                </>
              )}
            </button>
          </form>
        </div>

        {/* Role Descriptions */}
        <div className="mt-8 bg-white rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Role Descriptions</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-900">General Contractor:</span>
              <span className="text-gray-600"> Full access to update project progress, upload documents, and manage the project.</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Subcontractor:</span>
              <span className="text-gray-600"> Can view project details and upload documents related to their work scope.</span>
            </div>
            <div>
              <span className="font-medium text-gray-900">Viewer Only:</span>
              <span className="text-gray-600"> Can view project progress and documents but cannot make changes.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
