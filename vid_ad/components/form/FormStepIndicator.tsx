'use client';

interface Step {
  id: number;
  name: string;
  description: string;
}

interface FormStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export default function FormStepIndicator({
  steps,
  currentStep,
  onStepClick,
}: FormStepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} ${
              stepIdx !== 0 ? 'flex-1' : ''
            }`}
          >
            {stepIdx !== steps.length - 1 && (
              <div
                className="absolute top-4 left-8 -right-8 sm:left-12 sm:-right-20 h-0.5"
                aria-hidden="true"
              >
                <div
                  className={`h-full ${
                    step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`group relative flex items-center ${
                step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span className="flex h-9 items-center" aria-hidden="true">
                <span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                    step.id < currentStep
                      ? 'bg-blue-600 group-hover:bg-blue-800'
                      : step.id === currentStep
                      ? 'border-2 border-blue-600 bg-white'
                      : 'border-2 border-gray-300 bg-white'
                  }`}
                >
                  {step.id < currentStep ? (
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        step.id === currentStep ? 'bg-blue-600' : 'bg-transparent'
                      }`}
                    />
                  )}
                </span>
              </span>
              <span className="ml-4 flex min-w-0 flex-col">
                <span
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-xs text-gray-500">{step.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}