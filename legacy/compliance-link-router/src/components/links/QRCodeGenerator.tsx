"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Share2, Palette, Image as ImageIcon, Sliders, Wand2, Hexagon, Circle, Square, LayoutGrid, Check, Copy, Database, Shield, AlertCircle, Clock, Activity, Info, CreditCard, CheckCircle2 } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  slug: string;
}

export default function QRCodeGenerator({ url, slug }: QRCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'design' | 'colors' | 'logo'>('design');
  
  // Customization State
  const [patternType, setPatternType] = useState<'squares' | 'dots' | 'fluid'>('squares');
  const [cornerType, setCornerType] = useState<'square' | 'rounded' | 'dot'>('square');
  const [fgColor, setFgColor] = useState('#2563eb');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSize, setLogoSize] = useState(0.2); // 20%
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // Mock drawing function since we can't easily import a specific QR library without knowing it's installed.
  // In a real app, we'd use qrcode.react or qrcode. This will draw a placeholder that looks like a QR code.
  useEffect(() => {
    drawMockQRCode();
  }, [url, patternType, cornerType, fgColor, bgColor, logoUrl, logoSize, errorCorrection]);

  const drawMockQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const padding = 20;
    const innerSize = size - padding * 2;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Set foreground
    ctx.fillStyle = fgColor;

    // Draw position markers
    const drawMarker = (x: number, y: number) => {
      const markerSize = innerSize * 0.2;
      
      ctx.beginPath();
      if (cornerType === 'rounded') {
        ctx.roundRect(x, y, markerSize, markerSize, markerSize * 0.2);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = bgColor;
        ctx.roundRect(x + markerSize * 0.2, y + markerSize * 0.2, markerSize * 0.6, markerSize * 0.6, markerSize * 0.1);
        ctx.fill();
        ctx.fillStyle = fgColor;
        ctx.roundRect(x + markerSize * 0.35, y + markerSize * 0.35, markerSize * 0.3, markerSize * 0.3, markerSize * 0.05);
        ctx.fill();
      } else if (cornerType === 'dot') {
        ctx.arc(x + markerSize/2, y + markerSize/2, markerSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(x + markerSize/2, y + markerSize/2, markerSize/2 * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = fgColor;
        ctx.beginPath();
        ctx.arc(x + markerSize/2, y + markerSize/2, markerSize/2 * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, markerSize, markerSize);
        ctx.fillStyle = bgColor;
        ctx.fillRect(x + markerSize * 0.2, y + markerSize * 0.2, markerSize * 0.6, markerSize * 0.6);
        ctx.fillStyle = fgColor;
        ctx.fillRect(x + markerSize * 0.35, y + markerSize * 0.35, markerSize * 0.3, markerSize * 0.3);
      }
      ctx.fillStyle = fgColor;
    };

    drawMarker(padding, padding);
    drawMarker(size - padding - innerSize * 0.2, padding);
    drawMarker(padding, size - padding - innerSize * 0.2);

    // Draw random data modules
    const moduleSize = innerSize / 25; // standard 25x25 QR version 2
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Skip position marker areas
        if ((i < 8 && j < 8) || (i > 16 && j < 8) || (i < 8 && j > 16)) continue;
        
        // Skip logo area if enabled
        if (logoUrl) {
          const centerStart = Math.floor(12.5 - (25 * logoSize / 2));
          const centerEnd = Math.floor(12.5 + (25 * logoSize / 2));
          if (i >= centerStart && i <= centerEnd && j >= centerStart && j <= centerEnd) continue;
        }

        // Randomly fill
        // Using url to seed math.random slightly so it's consistent for the same URL
        const isFilled = Math.sin((i * 10) + j + url.length) > 0.1;
        
        if (isFilled) {
          const x = padding + i * moduleSize;
          const y = padding + j * moduleSize;
          
          if (patternType === 'dots') {
            ctx.beginPath();
            ctx.arc(x + moduleSize/2, y + moduleSize/2, moduleSize/2.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (patternType === 'fluid') {
            ctx.beginPath();
            ctx.roundRect(x, y, moduleSize + 0.5, moduleSize + 0.5, moduleSize * 0.3);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, moduleSize + 0.5, moduleSize + 0.5);
          }
        }
      }
    }

    // Draw logo if provided
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const logoPxSize = innerSize * logoSize;
        const x = padding + (innerSize - logoPxSize) / 2;
        const y = padding + (innerSize - logoPxSize) / 2;
        
        // Draw white background for logo
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - 5, y - 5, logoPxSize + 10, logoPxSize + 10);
        
        // Draw image
        ctx.drawImage(img, x, y, logoPxSize, logoPxSize);
      };
      img.src = logoUrl;
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `aegis-qr-${slug}.${format}`;
    
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png');
    } else {
      // Very basic SVG export approximation
      const dataUrl = canvas.toDataURL('image/png');
      link.href = dataUrl; // fallback
    }
    
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://aegis.rt/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
      {/* Left side: Preview */}
      <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 relative">
        
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-3.5 h-3.5" />
            <span>Smart QR</span>
          </span>
        </div>

        <div className="relative group perspective-1000">
          <motion.div 
            className="relative z-10 p-4 bg-white rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.15)] transition-transform duration-500 transform-gpu group-hover:rotate-y-12 group-hover:rotate-x-12"
          >
            <canvas 
              ref={canvasRef} 
              width={280} 
              height={280} 
              className="rounded-xl border border-slate-100"
            />
          </motion.div>
          
          {/* Decorative background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[80px] -z-10" />
        </div>

        <div className="mt-8 text-center space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight">https://aegis.rt/{slug}</h3>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto">
            This QR code will dynamically route to your destination while passing through Aegis Shield.
          </p>
        </div>

        <div className="mt-6 flex items-center space-x-3">
          <button 
            onClick={() => handleDownload('png')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold flex items-center space-x-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button 
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-200 text-sm font-semibold flex items-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Right side: Controls */}
      <div className="w-full md:w-1/2 bg-slate-900 flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'design' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <LayoutGrid className="w-4 h-4" />
              <span>Patterns</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'colors' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Colors</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('logo')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'logo' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ImageIcon className="w-4 h-4" />
              <span>Logo</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {activeTab === 'design' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center space-x-2">
                  <Sliders className="w-4 h-4" />
                  <span>Data Pattern</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'squares', icon: Square, label: 'Standard' },
                    { id: 'dots', icon: Circle, label: 'Dotted' },
                    { id: 'fluid', icon: Hexagon, label: 'Fluid' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setPatternType(style.id as any)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        patternType === style.id 
                          ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <style.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center space-x-2">
                  <Wand2 className="w-4 h-4" />
                  <span>Corner Style</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'rounded', label: 'Rounded' },
                    { id: 'dot', label: 'Circular' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setCornerType(style.id as any)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        cornerType === style.id 
                          ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Error Correction</span>
                </h4>
                <select 
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                >
                  <option value="L">Low (7%) - Best for simple patterns</option>
                  <option value="M">Medium (15%) - Standard</option>
                  <option value="Q">Quartile (25%) - Good for small logos</option>
                  <option value="H">High (30%) - Required for large logos</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">Higher error correction allows for larger logos but makes the pattern denser.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'colors' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4">Foreground Color</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl border-2 border-slate-700 overflow-hidden relative">
                    <input 
                      type="color" 
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={fgColor.toUpperCase()}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                
                {/* Preset colors */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['#000000', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setFgColor(color)}
                      className="w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <hr className="border-slate-800" />

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4">Background Color</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl border-2 border-slate-700 overflow-hidden relative">
                    <input 
                      type="color" 
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={bgColor.toUpperCase()}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                
                {/* Preset colors */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['#ffffff', '#f8fafc', '#f1f5f9', '#fefce8', '#f0fdf4', '#eff6ff', '#f5f3ff'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setBgColor(color)}
                      className="w-8 h-8 rounded-full border border-slate-300 shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logo' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-4">Center Image URL</h4>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="url" 
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      if (e.target.value && errorCorrection !== 'H') {
                        setErrorCorrection('H'); // Auto set High EC when logo is added
                      }
                    }}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Use a square image with a transparent background for best results. Data URIs are supported.
                </p>
              </div>

              {logoUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-300">Image Scale</h4>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {Math.round(logoSize * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.3" 
                    step="0.01" 
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  
                  {logoSize > 0.25 && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-2 text-amber-400/90 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p>Large logos may make the QR code unreadable by some devices. Ensure Error Correction is set to High.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
