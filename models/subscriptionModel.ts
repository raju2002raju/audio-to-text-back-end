// SubscriptionPlan.ts

export interface Feature {
    id: string;
    name: string;
    description: string;
  }
  
  export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    billingCycle: 'monthly' | 'yearly';
    features: Feature[];
    isPopular?: boolean;
  }
  

  export const sampleSubscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      description: 'Great for starters',
      price: 9.99,
      billingCycle: 'monthly',
      features: [
        { id: 'f1', name: 'Feature 1', description: 'Basic feature description' },
        { id: 'f2', name: 'Feature 2', description: 'Another basic feature' },
      ],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'For power users',
      price: 19.99,
      billingCycle: 'monthly',
      features: [
        { id: 'f1', name: 'Feature 1', description: 'Basic feature description' },
        { id: 'f2', name: 'Feature 2', description: 'Another basic feature' },
        { id: 'f3', name: 'Feature 3', description: 'Advanced feature' },
      ],
      isPopular: true,
    },

  ];