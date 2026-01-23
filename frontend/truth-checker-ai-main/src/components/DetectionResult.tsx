import { motion } from 'framer-motion';
import { Bot, User, HelpCircle, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Detection, getConfidenceEmoji, getConfidenceLabel } from '@/lib/credits';
import { cn } from '@/lib/utils';

interface DetectionResultProps {
  result: Detection;
  onClose?: () => void;
}

export function DetectionResult({ result, onClose }: DetectionResultProps) {
  const emoji = getConfidenceEmoji(result.probability, result.classification);
  const confidenceLabel = getConfidenceLabel(result.probability);
  const percentage = Math.round(result.probability * 100);

  const getClassificationColor = () => {
    if (result.classification === 'Human') return 'text-success';
    if (result.classification === 'AI') return 'text-destructive';
    return 'text-warning';
  };

  const getClassificationBg = () => {
    if (result.classification === 'Human') return 'bg-success/10 border-success/30';
    if (result.classification === 'AI') return 'bg-destructive/10 border-destructive/30';
    return 'bg-warning/10 border-warning/30';
  };

  const getIcon = () => {
    if (result.classification === 'Human') return <User className="h-6 w-6" />;
    if (result.classification === 'AI') return <Bot className="h-6 w-6" />;
    return <HelpCircle className="h-6 w-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className={cn("p-6 border-b border-border", getClassificationBg())}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl bg-background/50", getClassificationColor())}>
                {getIcon()}
              </div>
              <div>
                <h3 className={cn("text-2xl font-bold", getClassificationColor())}>
                  {result.classification}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {result.contentType} Analysis
                </p>
              </div>
            </div>
            <div className="text-6xl">{emoji}</div>
          </div>
        </div>

        {result.thumbnail && (
          <div className="px-6 py-4 border-b border-border">
            <img src={result.thumbnail} alt="Analyzed content" className="w-full max-h-64 object-contain rounded-lg bg-secondary" />
          </div>
        )}

        {/* Stats */}
        <div className="p-6 space-y-6">
          {/* Confidence meter */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Confidence Level</span>
              <span className="text-sm text-muted-foreground">{confidenceLabel}</span>
            </div>
            <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  result.classification === 'Human' 
                    ? 'bg-success' 
                    : result.classification === 'AI' 
                    ? 'bg-destructive' 
                    : 'bg-warning'
                )}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className={cn("text-lg font-bold", getClassificationColor())}>
                {percentage}%
              </span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>

          {/* Detection details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Source</span>
              </div>
              <p className="text-sm font-medium">{result.source}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                {result.classification === 'AI' ? (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                <span className="text-xs text-muted-foreground">Status</span>
              </div>
              <p className="text-sm font-medium">
                {result.classification === 'AI' 
                  ? 'AI-Generated' 
                  : result.classification === 'Human' 
                  ? 'Human-Created' 
                  : 'Needs Review'}
              </p>
            </div>
          </div>

          {/* Interpretation */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              {result.classification === 'AI' && (
                <>This content shows strong indicators of AI generation. The analysis detected patterns commonly associated with synthetic content.</>
              )}
              {result.classification === 'Human' && (
                <>This content appears to be authentically human-created. No significant AI generation patterns were detected.</>
              )}
              {result.classification === 'Inconclusive' && (
                <>The analysis could not determine the origin with high confidence. This content may be a mix of AI and human elements.</>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        {onClose && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors"
            >
              Analyze Another
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
