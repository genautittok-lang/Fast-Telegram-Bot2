import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Camera,
  MapPin,
  Calendar,
  Smartphone,
  Image as ImageIcon,
  FileImage,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExifResult {
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata: Record<string, any>;
  gps: { latitude: number; longitude: number } | null;
  hasGps: boolean;
  mapUrl?: string;
}

export default function ExifTool() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExifResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Error", description: "File too large (max 20MB)", variant: "destructive" });
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/exif", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to extract metadata");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to extract metadata from this image", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const clearResult = () => {
    setResult(null);
    setPreviewUrl(null);
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Date) return value.toLocaleString();
    if (key === "ExposureTime" && typeof value === "number") return `1/${Math.round(1 / value)}s`;
    if (key === "FNumber" && typeof value === "number") return `f/${value}`;
    if (key === "FocalLength" && typeof value === "number") return `${value}mm`;
    if (key === "GPSAltitude" && typeof value === "number") return `${value.toFixed(1)}m`;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const metadataGroups = result ? [
    {
      title: "Camera",
      icon: <Camera className="w-4 h-4" />,
      fields: ["Make", "Model", "LensMake", "LensModel", "Software"],
    },
    {
      title: "Settings",
      icon: <ImageIcon className="w-4 h-4" />,
      fields: ["ExposureTime", "FNumber", "ISO", "FocalLength", "Flash", "WhiteBalance"],
    },
    {
      title: "Image",
      icon: <FileImage className="w-4 h-4" />,
      fields: ["ImageWidth", "ImageHeight", "Orientation", "ColorSpace"],
    },
    {
      title: "Date & Time",
      icon: <Calendar className="w-4 h-4" />,
      fields: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    },
    {
      title: "Author",
      icon: <Info className="w-4 h-4" />,
      fields: ["Artist", "Copyright", "Description", "XPComment"],
    },
  ] : [];

  return (
    <PageLayout title="EXIF Metadata">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-display font-bold flex items-center justify-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            EXIF Metadata Extractor
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Upload a photo to extract hidden metadata — camera info, GPS coordinates, dates, and more. No data is stored or sent to third parties.
          </p>
        </motion.div>

        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-white/10 bg-black/20 hover:border-primary/50 hover:bg-black/30"
              }`}
              data-testid="exif-upload-zone"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-testid="input-exif-file"
              />
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Extracting metadata...</span>
                </div>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-lg font-medium mb-1">
                    {isDragging ? "Drop image here" : "Upload an image"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Drag & drop or click to select (JPEG, PNG, WebP, TIFF, HEIC — max 20MB)
                  </span>
                </>
              )}
            </label>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Results
              </h2>
              <Button variant="outline" size="sm" onClick={clearResult} data-testid="button-clear-exif">
                <X className="w-4 h-4 mr-1" /> New scan
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {previewUrl && (
                <Card className="p-3 bg-black/40 border-white/10 backdrop-blur-xl">
                  <img
                    src={previewUrl}
                    alt="Uploaded"
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>File:</span>
                      <span className="font-mono truncate ml-2 max-w-[200px]">{result.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-mono">{formatFileSize(result.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-mono">{result.mimeType}</span>
                    </div>
                  </div>
                </Card>
              )}

              <div className={`space-y-3 ${previewUrl ? "lg:col-span-2" : "lg:col-span-3"}`}>
                {result.hasGps && result.gps && (
                  <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 backdrop-blur-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-emerald-400">GPS Location Found</span>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Privacy Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>
                        <span className="font-mono ml-2">{result.gps.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>
                        <span className="font-mono ml-2">{result.gps.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                    {result.mapUrl && (
                      <a
                        href={result.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        data-testid="link-map"
                      >
                        <ExternalLink className="w-4 h-4" /> Open in Google Maps
                      </a>
                    )}
                  </Card>
                )}

                {!result.hasGps && (
                  <Card className="p-3 bg-black/20 border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>No GPS data found in this image</span>
                    </div>
                  </Card>
                )}

                {metadataGroups.map((group) => {
                  const hasData = group.fields.some((f) => result.metadata[f] !== undefined && result.metadata[f] !== null);
                  if (!hasData) return null;
                  return (
                    <Card key={group.title} className="p-4 bg-black/30 border-white/10 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-3">
                        {group.icon}
                        <span className="font-semibold text-sm">{group.title}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {group.fields.map((field) => {
                          const value = result.metadata[field];
                          if (value === undefined || value === null) return null;
                          return (
                            <div key={field} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{field.replace(/([A-Z])/g, " $1").trim()}:</span>
                              <span className="font-mono text-right ml-2 truncate max-w-[200px]">{formatValue(field, value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}

                {Object.keys(result.metadata).length === 0 && (
                  <Card className="p-4 bg-black/20 border-white/10 backdrop-blur-xl text-center">
                    <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No EXIF metadata found. This image may have been stripped of metadata (common on social media uploads).
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
}
