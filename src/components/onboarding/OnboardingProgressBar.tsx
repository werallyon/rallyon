import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  stepTitle?: string;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  canSkip = true,
  stepTitle
}) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full pb-4">
      <div className="flex items-center justify-between mb-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-7" />
        )}

        <div className="text-center">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Step {currentStep} of {totalSteps}
          </span>
          {stepTitle && <span className="text-[11px] text-neutral-500 block">{stepTitle}</span>}
        </div>

        {canSkip && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-neutral-400 hover:text-white font-medium"
          >
            Skip
          </button>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
