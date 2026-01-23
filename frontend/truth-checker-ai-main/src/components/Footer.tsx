import { Link } from 'react-router-dom';
import { Zap, Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-foreground">Debunk</span>
                <span className="text-gradient">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Multi-modal AI content verification platform. Detect AI-generated images, text, and videos with confidence.
            </p>
          </div>

          {/* Links */}
          {/* <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Detect
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div> */}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 mt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DebunkAI. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
