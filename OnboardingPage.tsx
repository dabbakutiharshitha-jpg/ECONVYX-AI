// 5-Step Business Onboarding Workflow Page

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../lib/api.js';
import {
  CheckCircle2,
  Building2,
  Sliders,
  Briefcase,
  Users,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { reloadAuth } = useAuth();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Business details
    name: '',
    industry: 'Engineering & Manufacturing',
    gstin: '',
    pan: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '',
    // Step 2: Financial preferences
    defaultCurrency: 'INR',
    financialYearStart: '04-01',
    defaultPaymentTermsDays: 30,
    timezone: 'Asia/Kolkata',
    // Step 3: Business operations
    businessType: 'manufacturing',
    // Step 4: Invite team
    teamInvites: '',
  });

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      addToast({ type: 'warning', title: 'Required', message: 'Please enter your business legal name.' });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteOnboarding = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.createWorkspaceOnboarding({
        name: formData.name,
        businessType: formData.businessType,
        industry: formData.industry,
        gstin: formData.gstin,
        pan: formData.pan,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        defaultCurrency: formData.defaultCurrency,
        financialYearStart: formData.financialYearStart,
        defaultPaymentTermsDays: formData.defaultPaymentTermsDays,
        timezone: formData.timezone,
      });

      addToast({
        type: 'success',
        title: 'Workspace Initialized',
        message: `${formData.name} workspace is configured and ready.`,
      });

      await reloadAuth();
      navigate('/');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Onboarding Failed', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center flex flex-col items-center">
          <Logo variant="dark" size="md" layout="stacked" />
          <h1 className="text-xl font-bold tracking-tight text-brand-primary-navy mt-4">
            Setup Your Business Financial Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Step {currentStep} of 5 &bull; Tailored for Indian MSMEs & B2B Credit Operations
          </p>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="flex items-center justify-between relative px-2">
          {[1, 2, 3, 4, 5].map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;

            return (
              <div key={step} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-brand-teal text-white'
                      : isCurrent
                      ? 'bg-brand-deep-navy text-white ring-4 ring-teal-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
                </div>
              </div>
            );
          })}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        </div>

        {/* Step Card Content */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-elevated space-y-6">
          {/* STEP 1: Business Details */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-slate-900">Step 1: Business Identification</h2>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Business Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paramount Castings India Pvt Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-brand-teal text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAACP1234..."
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">PAN (Optional)</label>
                  <input
                    type="text"
                    placeholder="AAACP1234M"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">PIN Code</label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financial Preferences */}
          {currentStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-slate-900">Step 2: Financial Preferences</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Default Currency</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹) - Indian Rupee"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Financial Year Cycle</label>
                  <input
                    type="text"
                    disabled
                    value="April 1 to March 31"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Standard Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defaultPaymentTermsDays}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultPaymentTermsDays: parseInt(e.target.value) || 30 })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-teal font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Default Timezone</label>
                  <input
                    type="text"
                    disabled
                    value="Asia/Kolkata (IST)"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Business Operations */}
          {currentStep === 3 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-slate-900">Step 3: Primary Operations Model</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'manufacturing', label: 'Manufacturing & Production', desc: 'Raw material procurement, production lines, job work, and goods dispatch.' },
                  { id: 'wholesale', label: 'Wholesale & B2B Trading', desc: 'Bulk supply, trader credit terms, and multi-tier pricing.' },
                  { id: 'distribution', label: 'Distribution & Logistics', desc: 'Warehouse inventory, regional distribution, and freight management.' },
                  { id: 'services', label: 'B2B Professional Services', desc: 'Consulting, engineering contracting, and milestone invoicing.' },
                ].map((op) => (
                  <div
                    key={op.id}
                    onClick={() => setFormData({ ...formData, businessType: op.id as any })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.businessType === op.id
                        ? 'border-brand-teal bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{op.label}</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{op.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Invite Team */}
          {currentStep === 4 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-slate-900">Step 4: Invite Team Members (Optional)</h2>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Team Emails (Comma separated)</label>
                <textarea
                  rows={4}
                  placeholder="finance@company.com, accounts@company.com"
                  value={formData.teamInvites}
                  onChange={(e) => setFormData({ ...formData, teamInvites: e.target.value })}
                  className="w-full mt-1 p-3 border border-slate-200 rounded-lg outline-none focus:border-brand-teal"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can assign detailed roles (Accountant, Finance Manager) later from Settings.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: Confirm & Launch */}
          {currentStep === 5 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <h2 className="text-sm font-bold text-slate-900">Step 5: Review & Initialize Workspace</h2>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Business Name:</span>
                  <span className="font-bold text-slate-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operations Model:</span>
                  <span className="font-semibold capitalize text-slate-800">{formData.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Currency:</span>
                  <span className="font-bold text-brand-teal">INR (₹)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="text-slate-800">{formData.defaultPaymentTermsDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{formData.city}, {formData.state}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic text-center">
                Your isolated tenant database partition and secure document storage will be initialized.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-brand-deep-navy hover:bg-brand-midnight rounded-lg shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteOnboarding}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg shadow-md transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Workspace...' : 'Launch Workspace'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
