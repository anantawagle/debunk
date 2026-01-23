import { useState, useCallback } from 'react';
import { Upload, Image, FileText, Video, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ContentType = 'image' | 'text' | 'video';

interface DetectionUploadProps {
  onAnalyze: (content: File | string, type: ContentType) => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

export function DetectionUpload({ onAnalyze, isAnalyzing, disabled }: DetectionUploadProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('image');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [activeTab]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setTextContent('');
  };

  const handleAnalyze = () => {
    if (activeTab === 'text' && textContent.trim()) {
      onAnalyze(textContent.trim(), 'text');
    } else if (selectedFile) {
      onAnalyze(selectedFile, activeTab);
    }
  };

  const canAnalyze = activeTab === 'text' 
    ? textContent.trim().length > 20 
    : !!selectedFile;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ContentType); handleClear(); }}>
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/50 p-1">
          <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Image className="h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-0">
          <DropZone
            type="image"
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            preview={preview}
            onClear={handleClear}
            accept="image/*"
          />
        </TabsContent>

        <TabsContent value="text" className="mt-0">
          <div className="glass-card p-6">
            <Textarea
              placeholder="Paste the text you want to analyze for AI generation... (minimum 20 characters)"
              className="min-h-[200px] bg-transparent border-border/50 focus:border-primary/50 resize-none text-base"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-muted-foreground">
                {textContent.length} characters
              </span>
              {textContent.length > 0 && textContent.length < 20 && (
                <span className="text-xs text-warning">
                  Minimum 20 characters required
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-0">
          <DropZone
            type="video"
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            preview={preview}
            onClear={handleClear}
            accept="video/*"
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-center">
        <Button
          variant="hero"
          size="xl"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing || disabled}
          className="min-w-[200px]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Analyze Content
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface DropZoneProps {
  type: 'image' | 'video';
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  preview: string | null;
  onClear: () => void;
  accept: string;
}

function DropZone({ 
  type, 
  dragOver, 
  setDragOver, 
  onDrop, 
  onFileSelect, 
  selectedFile, 
  preview, 
  onClear,
  accept 
}: DropZoneProps) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  if (selectedFile && preview) {
    return (
      <div className="glass-card p-6 relative overflow-hidden">
        <button
          onClick={onClear}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        {type === 'image' ? (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain"
            />
            <div className="scan-line" />
          </div>
        ) : (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
            <video 
              src={preview} 
              controls 
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-4 text-center truncate">
          {selectedFile.name}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-8 border-2 border-dashed transition-all duration-200 cursor-pointer",
        dragOver 
          ? "border-primary bg-primary/5" 
          : "border-border/50 hover:border-primary/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById(`file-${type}`)?.click()}
    >
      <input
        id={`file-${type}`}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="p-4 rounded-2xl bg-secondary border border-border">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary">
            {type === 'image' ? (
              <Image className="h-3 w-3 text-primary-foreground" />
            ) : (
              <Video className="h-3 w-3 text-primary-foreground" />
            )}
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium">
            Drop your {type} here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {type === 'image' ? 'PNG, JPG, GIF up to 20MB' : 'MP4, MOV, WebM up to 20MB'}
        </p>
      </div>
    </div>
  );
}
