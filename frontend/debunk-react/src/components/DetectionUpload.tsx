import { useState, useCallback } from 'react';
import { Upload, Image, FileText, Video, X, Loader2, Sparkles, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ContentType = 'image' | 'video';

interface DropZoneProps {
  type: 'image';
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
        
        {type === 'image' && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
            <div className="scan-line" />
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
            <Image className="h-3 w-3 text-primary-foreground" />
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
          PNG, JPG, GIF up to 20MB
        </p>
      </div>
    </div>
  );
}

interface VideoDropZoneProps {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  preview: string | null;
  onClear: () => void;
}

function VideoDropZone({ 
  dragOver, 
  setDragOver, 
  onDrop, 
  onFileSelect, 
  selectedFile, 
  preview, 
  onClear 
}: VideoDropZoneProps) {
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
        
        <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
          <video
            src={preview}
            controls
            className="max-h-full max-w-full"
          />
        </div>
        
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
      onClick={() => document.getElementById('file-video')?.click()}
    >
      <input
        id="file-video"
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="p-4 rounded-2xl bg-secondary border border-border">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary">
            <Video className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium">
            Drop your video here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          MP4, MOV, AVI up to 100MB
        </p>
      </div>
    </div>
  );
}

interface TextInputAreaProps {
  textContent: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
}

function TextInputArea({ textContent, onTextChange, onClear }: TextInputAreaProps) {
  const charCount = textContent.length;
  const isValid = charCount >= 20;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Enter Text to Analyze</h3>
        {textContent && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <Textarea
        value={textContent}
        onChange={onTextChange}
        placeholder="Paste or type the text you want to analyze for AI-generated content..."
        className="min-h-[200px] resize-none"
      />
      
      <div className="flex items-center justify-between mt-4">
        <p className={cn(
          "text-sm",
          isValid ? "text-green-500" : "text-muted-foreground"
        )}>
          {isValid ? '✓ Ready to analyze' : `Minimum 20 characters required (${charCount}/20)`}
        </p>
        
        <p className="text-xs text-muted-foreground">
          Supports multiple paragraphs
        </p>
      </div>
    </div>
  );
}

interface UrlInputAreaProps {
  url: string;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  contentType: 'image' | 'video';
}

function UrlInputArea({ url, onUrlChange, onClear, contentType }: UrlInputAreaProps) {
  const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
  const targetType = contentType === 'image' ? 'image' : 'video';

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Paste {targetType} URL</h3>
        {url && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              value={url}
              onChange={onUrlChange}
              placeholder={`Paste a direct link to your ${targetType}...`}
              className="pl-10"
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Supported: Direct links to {contentType === 'image' ? 'PNG, JPG, JPEG, WebP' : 'MP4, MOV, AVI, WebM'} files
        </p>
        
        <p className={cn(
          "text-sm",
          isValidUrl ? "text-green-500" : "text-muted-foreground"
        )}>
          {isValidUrl ? '✓ Valid URL format' : 'URL must start with http:// or https://'}
        </p>
      </div>
    </div>
  );
}

interface DetectionUploadProps {
  onAnalyze: (content: File | string, type: ContentType, isUrl?: boolean) => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

export function DetectionUpload({ onAnalyze, isAnalyzing, disabled }: DetectionUploadProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('image');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile, activeTab);
    }
  };

  const canAnalyze = !!selectedFile;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ContentType); handleClear(); }}>
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/50 p-1">
          <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Image className="h-4 w-4" />
            Image
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

        <TabsContent value="video" className="mt-0">
          <VideoDropZone
            dragOver={dragOver}
            setDragOver={setDragOver}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            preview={preview}
            onClear={handleClear}
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
