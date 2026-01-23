import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    credits: 25,
    price: 5,
    features: ['25 detection credits', 'All content types', 'Detection history'],
  },
  {
    name: 'Pro',
    credits: 100,
    price: 15,
    popular: true,
    features: ['100 detection credits', 'Priority processing', 'Detailed reports', 'Export to PDF'],
  },
  {
    name: 'Team',
    credits: 500,
    price: 50,
    features: ['500 detection credits', 'Everything in Pro', 'API access', 'Team dashboard'],
  },
];

export function PricingPreview() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pay only for what you use. No subscriptions, no hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`glass-card p-8 relative ${
                plan.popular ? 'border-primary/50 ring-2 ring-primary/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.credits} credits
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/pricing">
                <Button
                  variant={plan.popular ? 'hero' : 'outline'}
                  className="w-full"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
