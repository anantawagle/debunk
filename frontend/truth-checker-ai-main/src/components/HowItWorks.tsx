import { Upload, Cpu, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Content',
    description: 'Drop an image, paste text, or upload a video file for analysis.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description: 'Our multi-modal detection engine scans for AI-generation patterns.',
  },
  {
    icon: ShieldCheck,
    title: 'Get Results',
    description: 'Receive a detailed report with confidence scores and indicators.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify content authenticity in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="glass-card p-8 text-center group-hover:border-primary/30 transition-colors">
                <div className="relative inline-flex mb-6">
                  <div className="p-4 rounded-2xl bg-secondary border border-border group-hover:border-primary/30 transition-colors">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
