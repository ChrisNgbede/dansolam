import React from 'react';
import { Check } from 'lucide-react';

export default function CheckoutStepper({ currentStep = 1 }) {
  const steps = [
    { id: 1, label: 'Shopping Cart' },
    { id: 2, label: 'Checkout' },
    { id: 3, label: 'Confirmation' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-3 sm:my-4 select-none">
      <div className="bg-white dark:bg-[#1E1528] backdrop-blur-md px-5 py-3 md:px-8 md:py-4 rounded-full border border-[#EADBEE] dark:border-white/10 shadow-md flex items-center justify-between gap-2 md:gap-4">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Number / Check Circle */}
                <div
                  className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : isActive
                      ? 'bg-[#5D3E85] text-white shadow-sm ring-3 ring-[#5D3E85]/20 scale-105'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] md:text-xs transition-all ${
                    isActive
                      ? 'font-extrabold text-[#221B2B] dark:text-[#F3EFF6] tracking-tight'
                      : isCompleted
                      ? 'font-bold text-gray-700 dark:text-[#C9BED4]'
                      : 'font-semibold text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Bar */}
              {idx < steps.length - 1 && (
                <div className="flex-1 min-w-[14px] max-w-[50px] md:max-w-[80px] mx-1">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      currentStep > step.id
                        ? 'bg-emerald-500'
                        : currentStep === step.id
                        ? 'bg-gradient-to-r from-[#5D3E85] to-gray-200 dark:to-white/10'
                        : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
