import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Separator,
} from '@imriva/framework';
import { Upload, Image, Palette, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const colorPresets = [
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
];

const StudioBranding = () => {
  const t = useT();
  const [primaryColor, setPrimaryColor] = useState('#14b8a6');
  const [appName, setAppName] = useState('vdpConnect');
  const [tagline, setTagline] = useState('Real Estate Professional Network');

  const handleLogoUpload = () => {
    toast.info(t('toasts.logoUploadWouldOpen'));
  };

  const handleFaviconUpload = () => {
    toast.info(t('toasts.faviconUploadWouldOpen'));
  };

  const handleSave = () => {
    toast.success(t('toasts.brandingSettingsSaved'));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo & Favicon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>App Logo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <Button variant="outline" size="sm" onClick={handleLogoUpload}>
                  Choose File
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg" />
                </div>
                <Button variant="outline" size="sm" onClick={handleFaviconUpload}>
                  Replace
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 font-mono"
                placeholder="#14b8a6"
              />
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Color Presets</Label>
            <div className="flex flex-wrap gap-3">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    primaryColor === color.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  v
                </div>
                <span className="font-semibold">{appName}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Outline Button
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            App Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="My App Name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short description of your app"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Meta Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="A longer description for SEO purposes..."
              defaultValue="vdpConnect is a professional networking platform for real estate professionals to connect, share insights, and grow their business."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default StudioBranding;
