// types/explanation.ts
export interface ExplanationStep {
  id: string;
  title: string;
  content: string;
  image?: string;
  position?: {
    elementSelector?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    x?: number;
    y?: number;
  };
  action?: {
    type: 'click' | 'hover' | 'scroll';
    selector?: string;
  };
}

export interface PageExplanation {
  page: string;
  title: string;
  description: string;
  steps: ExplanationStep[];
  required?: boolean;
  version: number;
}