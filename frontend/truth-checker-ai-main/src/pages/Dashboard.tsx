import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { getConfidenceEmoji } from '@/lib/credits';
import { toast } from 'sonner';
import {
  CreditCard,
  History,
  Image,
  FileText,
  Video,
  LogOut,
  Plus,
  Bot,
  User,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackendDetection {
  id: number;
  content_name: string;
  content_type: string;
  is_ai_generated: boolean | null;
  confidence_score: number | null;
  model_used: string | null;
  created_at: string;
  processed_at: string | null;
  content_text?: string;
}

interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [detections, setDetections] = useState<BackendDetection[]>([]);
  const [totalDetections, setTotalDetections] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      navigate('/auth');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load user profile
      const userProfile = await apiClient.getUserProfile();
      setUser(userProfile);
      setIsLoggedIn(true);

      // Load detection history
      const detectionData = await apiClient.getUserDetections(0, 100);
      setDetections(detectionData.items || []);
      setTotalDetections(detectionData.total || 0);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // If authentication fails, redirect to login
      if (error instanceof Error && error.message.includes('401')) {
        apiClient.logout();
        navigate('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getClassification = (detection: BackendDetection) => {
    if (detection.is_ai_generated === null) return 'Processing';
    return detection.is_ai_generated ? 'AI' : 'Human';
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'AI': return <Bot className="h-4 w-4" />;
      case 'Human': return <User className="h-4 w-4" />;
      case 'Processing': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'AI': return 'text-destructive';
      case 'Human': return 'text-success';
      case 'Processing': return 'text-muted-foreground';
      default: return 'text-warning';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your credits and view detection history
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Detection
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Credits</span>
              </div>
              <div className="text-3xl font-bold">∞</div>
              <p className="text-sm text-muted-foreground mt-2">
                Unlimited free access
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Detections</span>
              </div>
              <div className="text-3xl font-bold">{totalDetections}</div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Bot className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">AI Detected</span>
              </div>
              <div className="text-3xl font-bold">
                {detections.filter(d => d.is_ai_generated === true).length}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <User className="h-5 w-5 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Human Verified</span>
              </div>
              <div className="text-3xl font-bold">
                {detections.filter(d => d.is_ai_generated === false).length}
              </div>
            </div>
          </div>

          {/* Detection History */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Detection History</h2>
            </div>
            
            {detections.length === 0 ? (
              <div className="p-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No detections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start analyzing content to see your history here.
                </p>
                <Link to="/">
                  <Button variant="default">
                    Make Your First Detection
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {detections.map((detection) => {
                  const classification = getClassification(detection);
                  const confidence = detection.confidence_score || 0.5;

                  return (
                    <div key={detection.id} className="p-4 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Type icon */}
                        <div className="p-2 rounded-lg bg-secondary">
                          {getContentIcon(detection.content_type)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "flex items-center gap-1 text-sm font-medium",
                              getClassificationColor(classification)
                            )}>
                              {getClassificationIcon(classification)}
                              {classification}
                            </span>
                            {classification !== 'Processing' && (
                              <span className="text-lg">
                                {getConfidenceEmoji(confidence, classification)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {detection.content_text ?
                              detection.content_text.slice(0, 100) + (detection.content_text.length > 100 ? '...' : '') :
                              `${detection.content_name} - ${detection.content_type} analysis`
                            }
                          </p>
                        </div>

                        {/* Confidence */}
                        {classification !== 'Processing' && (
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              {Math.round(confidence * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              confidence
                            </div>
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          {new Date(detection.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
