import { Image, Video, FileText, Lock, Zap, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Image,
    title: 'Image Detection',
    description: 'Analyze metadata, pixel patterns, and ML signatures to detect AI-generated images.',
  },
  {
    icon: Video,
    title: 'Video Detection',
    description: 'Detect deepfakes and manipulated videos using frame-by-frame analysis and temporal consistency checks.',
  },
  {
    icon: FileText,
    title: 'Text Analysis',
    description: 'Identify AI-generated text by analyzing linguistic patterns, coherence, and statistical anomalies.',
  },
  {
    icon: Zap,
    title: 'Fast Results',
    description: 'Get instant analysis with our optimized detection pipeline.',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'Your content is never stored. All processing happens securely.',
  },
  {
    icon: BarChart3,
    title: 'Detailed Reports',
    description: 'Comprehensive confidence scores and detection sources.',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Features of <span className="text-gradient">DebunkAI</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI content verification across all media types
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 group hover:border-primary/30 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
