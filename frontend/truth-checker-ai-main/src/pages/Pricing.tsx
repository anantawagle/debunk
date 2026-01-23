import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Check, Zap, Shield, Clock } from 'lucide-react';
import { addCredits, getUsageData } from '@/lib/credits';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    credits: 25,
    price: 5,
    pricePerCredit: 0.20,
    features: [
      '25 detection credits',
      'Image, text & video analysis',
      'Detection history',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    credits: 100,
    price: 15,
    pricePerCredit: 0.15,
    popular: true,
    features: [
      '100 detection credits',
      'Everything in Starter',
      'Priority processing',
      'Detailed reports',
      'Export to PDF/JSON',
    ],
  },
  {
    name: 'Team',
    credits: 500,
    price: 50,
    pricePerCredit: 0.10,
    features: [
      '500 detection credits',
      'Everything in Pro',
      'API access',
      'Team dashboard',
      'Dedicated support',
    ],
  },
];

const faqs = [
  {
    question: 'What counts as one credit?',
    answer: 'Each detection (image, text, or video) uses 1 credit, regardless of content type or file size.',
  },
  {
    question: 'Do credits expire?',
    answer: 'No, your credits never expire. Use them whenever you need.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'We offer full refunds within 14 days if you haven\'t used your credits.',
  },
  {
    question: 'Is my content stored?',
    answer: 'No. Your content is analyzed in real-time and immediately discarded. We never store your files.',
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  const handlePurchase = (plan: typeof plans[0]) => {
    const data = getUsageData();
    
    if (!data.isLoggedIn) {
      toast.error('Please sign in to purchase credits', {
        action: {
          label: 'Sign In',
          onClick: () => navigate('/auth'),
        },
      });
      return;
    }

    // Simulate purchase
    addCredits(plan.credits);
    toast.success(`🎉 ${plan.credits} credits added to your account!`);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span>Pay As You Go</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              No subscriptions. No hidden fees. Just buy credits and use them whenever you need.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
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
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.credits} detection credits
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${plan.pricePerCredit.toFixed(2)} per detection
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? 'hero' : 'outline'}
                  className="w-full"
                  onClick={() => handlePurchase(plan)}
                >
                  Get {plan.credits} Credits
                </Button>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-24">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>No Expiration</span>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="glass-card p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
