import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DetectionUpload } from '@/components/DetectionUpload';
import { DetectionResult } from '@/components/DetectionResult';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { PricingPreview } from '@/components/PricingPreview';
import AuthModal from '@/components/AuthModal';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Detection } from '@/lib/credits';

export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Detection | null>(null);
  const [detectionId, setDetectionId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleAnalyze = useCallback(async (content: File | string, type: 'image' | 'video' | 'text') => {
    if (!apiClient.isAuthenticated()) {
      toast.error('Please sign in to use the detection service.', {
        action: {
          label: 'Sign In',
          onClick: () => setShowLoginModal(true),
        },
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setDetectionId(null);

    try {
      // Upload content
      const uploadResponse = await apiClient.uploadContent(content, type);
      const id = uploadResponse.id;
      setDetectionId(id);

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiClient.getDetectionStatus(id);
          if (statusResponse.status === 'completed') {
            clearInterval(pollInterval);
            const detection = statusResponse.detection;

            const classification = detection.is_ai_generated
              ? 'AI'
              : detection.is_ai_generated === false
                ? 'Human'
                : 'Inconclusive';

            const resultData: Detection = {
              id: detection.id.toString(),
              contentType: type,
              classification,
              probability: detection.confidence_score || 0.5,
              source: detection.model_used || 'AI Analysis',
              timestamp: Date.now(),
              snippet: undefined,
              thumbnail: (type === 'image' || type === 'video') && content instanceof File ? URL.createObjectURL(content) : undefined,
            };

            setResult(resultData);
            setIsAnalyzing(false);
            toast.success('Analysis complete!');
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isAnalyzing) {
          setIsAnalyzing(false);
          toast.error('Analysis timed out. Please try again.');
        }
      }, 30000);

    } catch (error) {
      setIsAnalyzing(false);
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        toast.error('Your session has expired. Please sign in again.', {
          action: {
            label: 'Sign In',
            onClick: () => setShowLoginModal(true),
          },
        });
      } else {
        toast.error('Upload failed. Please try again.');
      }
    }
  }, [isAnalyzing]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSignInClick={() => setShowLoginModal(true)} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Hero content */}
          <div className="text-center mb-12 max-w-4xl mx-auto">
            {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Distinguishing AI vs Real</span>
            </div> */}
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Verify If Content Is{' '}
              <span className="text-gradient"><br/>AI-Generated</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              DebunkAI detects AI-generated images with advanced machine learning.
              Know what's real in a world of synthetic content.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>Multi-layer Detection</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>99% Accuracy</span>
              </div>
            </div>
          </div>

          {/* Detection interface */}
          <div className="max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {result ? (
              <DetectionResult
                result={result}
                onClose={() => setResult(null)}
              />
            ) : (
              <DetectionUpload
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                disabled={!apiClient.isAuthenticated()}
              />
            )}

            {/* Auth reminder */}
            {!result && !apiClient.isAuthenticated() && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-primary hover:underline"
                >
                  Sign in to start detecting AI content
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      <HowItWorks />
      <Features />
      {/* <PricingPreview /> */}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-gradient">Debunk</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start verifying content authenticity today. No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="hero"
              size="lg"
              onClick={() => setShowSignupModal(true)}
            >
              Get Started Free
            </Button>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modals */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode="login"
      />
      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        initialMode="signup"
      />
    </div>
  );
}
