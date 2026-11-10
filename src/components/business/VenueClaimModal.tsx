import React, { useState } from 'react';
import { Shield, Building2, CheckCircle2, X, Phone, Mail, FileText, AlertCircle } from 'lucide-react';
import { Venue, ClaimVerificationStatus } from '../../types';
import { businessVenueService } from '../../services/businessVenueService';
import { useAuth } from '../../context/AuthContext';

interface VenueClaimModalProps {
  venue: Venue;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

export const VenueClaimModal: React.FC<VenueClaimModalProps> = ({
  venue,
  onClose,
  onClaimSubmitted
}) => {
  const { currentUser } = useAuth();

  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(venue.phone || '');
  const [role, setRole] = useState('General Manager');
  const [verificationMethod, setVerificationMethod] = useState<
    'PHONE_CALL' | 'BUSINESS_EMAIL' | 'UTILITY_BILL' | 'MANUAL_AUDIT'
  >('PHONE_CALL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingClaim = businessVenueService.getClaimForVenue(venue.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail || !applicantPhone) {
      setError('Please fill in all required verification fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await businessVenueService.submitClaim({
        venue_id: venue.id,
        applicant_user_id: currentUser?.id || 'usr_guest',
        business_name: venue.name,
        applicant_name: applicantName.trim(),
        applicant_email: applicantEmail.trim(),
        applicant_phone: applicantPhone.trim(),
        role: role.trim(),
        verification_method: verificationMethod,
        notes: notes.trim()
      });

      setSubmitted(true);
      setTimeout(() => {
        onClaimSubmitted();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Claim This Venue</h3>
              <p className="text-[11px] text-neutral-400">{venue.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {existingClaim && existingClaim.verification_status === 'PENDING' ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Claim Already Under Review</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                A verification claim for <span className="text-amber-400 font-bold">{venue.name}</span> is currently pending review by RallyOn platform administrators.
              </p>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 text-left">
                <span className="text-neutral-300 font-bold block mb-1">Status Details:</span>
                • Applicant: {existingClaim.applicant_name} ({existingClaim.role})<br />
                • Method: {existingClaim.verification_method.replace('_', ' ')}<br />
                • Submitted: {new Date(existingClaim.submitted_at).toLocaleDateString()}
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-200 hover:bg-neutral-700"
              >
                Close
              </button>
            </div>
          ) : submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Claim Submitted Successfully</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Our verification team will review your business credentials and contact you via {applicantPhone} to verify ownership.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Official venue operators can control live sports programming ("What We're Airing"), post promotions, and access real-time crowd analytics.
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500"
                    placeholder="Marcus Vance"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Your Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500"
                    placeholder="General Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500"
                    placeholder="gm@venue.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Business Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500"
                    placeholder="(512) 555-0199"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Verification Method
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'PHONE_CALL', label: 'Phone Callback', icon: Phone },
                    { id: 'BUSINESS_EMAIL', label: 'Domain Email', icon: Mail },
                    { id: 'UTILITY_BILL', label: 'Business License', icon: FileText },
                    { id: 'MANUAL_AUDIT', label: 'Manual Audit', icon: Shield }
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setVerificationMethod(m.id as any)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-colors ${
                          verificationMethod === m.id
                            ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Website link, manager shift hours, or verification details..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
