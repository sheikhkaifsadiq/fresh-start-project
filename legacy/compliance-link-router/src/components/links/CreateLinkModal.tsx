"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  X, Link as LinkIcon, Shield, Lock, Globe, Clock, Tag, 
  Settings, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal,
  Smartphone, Monitor, Activity, Zap
} from "lucide-react";

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type GeoRule = {
  country: string;
  url: string;
};

type DeviceRule = {
  device: "mobile" | "desktop" | "tablet";
  url: string;
};

export default function CreateLinkModal({ isOpen, onClose, onSuccess }: CreateLinkModalProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"general" | "targeting" | "protection" | "metadata">("general");
  
  // Form State
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [customDomain, setCustomDomain] = useState("aegis.rt");
  
  // Targeting
  const [geoRules, setGeoRules] = useState<GeoRule[]>([]);
  const [deviceRules, setDeviceRules] = useState<DeviceRule[]>([]);
  
  // Protection
  const [isShielded, setIsShielded] = useState(true);
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [clickLimit, setClickLimit] = useState("");
  
  // Metadata
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImageUrl, setMetaImageUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time checks
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Generate random slug
  const generateRandomSlug = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlug(result);
  };

  useEffect(() => {
    if (slug.length > 2) {
      const checkSlug = async () => {
        setCheckingSlug(true);
        const { data, error } = await supabase
          .from("links")
          .select("id")
          .eq("slug", slug)
          .single();
        
        if (error && error.code === "PGRST116") {
          setIsSlugAvailable(true); // not found
        } else if (data) {
          setIsSlugAvailable(false);
        }
        setCheckingSlug(false);
      };
      
      const timer = setTimeout(checkSlug, 500);
      return () => clearTimeout(timer);
    } else {
      setIsSlugAvailable(null);
    }
  }, [slug, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!destinationUrl) throw new Error("Destination URL is required.");
      if (slug && isSlugAvailable === false) throw new Error("Custom back-half is already taken.");

      const finalSlug = slug || Math.random().toString(36).substring(2, 9);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const payload = {
        user_id: userData.user.id,
        destination_url: destinationUrl,
        slug: finalSlug,
        active: true,
        click_count: 0,
        // Advanced JSON metadata
        metadata: {
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          geo_rules: geoRules,
          device_rules: deviceRules,
          protection: {
            is_shielded: isShielded,
            password: password ? password : null,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            click_limit: clickLimit ? parseInt(clickLimit) : null
          },
          seo: {
            title: metaTitle,
            description: metaDescription,
            image_url: metaImageUrl
          }
        }
      };

      const { error: insertError } = await supabase.from("links").insert(payload);
      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the link.");
    } finally {
      setIsLoading(false);
    }
  };

  const addGeoRule = () => setGeoRules([...geoRules, { country: "", url: "" }]);
  const removeGeoRule = (index: number) => setGeoRules(geoRules.filter((_, i) => i !== index));
  
  const addDeviceRule = () => setDeviceRules([...deviceRules, { device: "mobile", url: "" }]);
  const removeDeviceRule = (index: number) => setDeviceRules(deviceRules.filter((_, i) => i !== index));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Protected Pathway</h2>
              <p className="text-sm text-slate-400">Configure destination, routing logic, and compliance shields.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-full md:w-64 bg-slate-900/30 border-r border-slate-800 flex-shrink-0 p-4 space-y-2 overflow-y-auto">
            <button 
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "general" ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
            >
              <LinkIcon className="w-4 h-4" /> <span>General Info</span>
            </button>
            <button 
              onClick={() => setActiveTab("targeting")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "targeting" ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> <span>Smart Targeting</span>
            </button>
            <button 
              onClick={() => setActiveTab("protection")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "protection" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
            >
              <Shield className="w-4 h-4" /> <span>Compliance & Shields</span>
            </button>
            <button 
              onClick={() => setActiveTab("metadata")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "metadata" ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
            >
              <Tag className="w-4 h-4" /> <span>SEO & Metadata</span>
            </button>
          </div>

          {/* Form Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form id="create-link-form" onSubmit={handleSubmit} className="space-y-8">
              
              {activeTab === "general" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Destination URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <input 
                        type="url" 
                        required
                        placeholder="https://example.com/very/long/path?utm_source=google"
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Domain</label>
                      <select 
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                      >
                        <option value="aegis.rt">aegis.rt</option>
                        <option value="link.mycompany.com">link.mycompany.com</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-300">Custom Back-half (Slug)</label>
                        <button type="button" onClick={generateRandomSlug} className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" /> <span>Randomize</span>
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-slate-800 pr-3">
                          <span className="text-slate-500 font-medium text-sm">/</span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="promo-2026"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                          className="block w-full pl-12 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {checkingSlug ? (
                            <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
                          ) : isSlugAvailable === true ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : isSlugAvailable === false ? (
                            <X className="w-5 h-5 text-red-500" />
                          ) : null}
                        </div>
                      </div>
                      {isSlugAvailable === false && (
                        <p className="text-xs text-red-400 mt-2">This back-half is already taken.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Tags (Comma separated)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Tag className="h-4 w-4 text-slate-500" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="marketing, Q3, social-media"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "targeting" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  
                  {/* Geo Targeting */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                          <Globe className="w-5 h-5 text-indigo-400" />
                          <span>Geographic Routing</span>
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Route visitors based on their physical location.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={addGeoRule}
                        className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                      >
                        + Add Geo Rule
                      </button>
                    </div>
                    
                    {geoRules.length === 0 ? (
                      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                        No geo-rules active. All visitors will go to the default destination.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {geoRules.map((rule, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                            <select 
                              value={rule.country}
                              onChange={(e) => {
                                const newRules = [...geoRules];
                                newRules[idx].country = e.target.value;
                                setGeoRules(newRules);
                              }}
                              className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Country</option>
                              <option value="US">United States</option>
                              <option value="GB">United Kingdom</option>
                              <option value="CA">Canada</option>
                              <option value="AU">Australia</option>
                              <option value="DE">Germany</option>
                              <option value="FR">France</option>
                              <option value="JP">Japan</option>
                            </select>
                            <input 
                              type="url"
                              placeholder="https://us.example.com"
                              value={rule.url}
                              onChange={(e) => {
                                const newRules = [...geoRules];
                                newRules[idx].url = e.target.value;
                                setGeoRules(newRules);
                              }}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                            />
                            <button type="button" onClick={() => removeGeoRule(idx)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-800" />

                  {/* Device Targeting */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                          <Smartphone className="w-5 h-5 text-indigo-400" />
                          <span>Device Routing</span>
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Route visitors based on their device type.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={addDeviceRule}
                        className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                      >
                        + Add Device Rule
                      </button>
                    </div>
                    
                    {deviceRules.length === 0 ? (
                      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">
                        No device rules active.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deviceRules.map((rule, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                            <select 
                              value={rule.device}
                              onChange={(e) => {
                                const newRules = [...deviceRules];
                                newRules[idx].device = e.target.value as any;
                                setDeviceRules(newRules);
                              }}
                              className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="mobile">Mobile (iOS/Android)</option>
                              <option value="desktop">Desktop</option>
                              <option value="tablet">Tablet</option>
                            </select>
                            <input 
                              type="url"
                              placeholder="App Store URL or Specific Page"
                              value={rule.url}
                              onChange={(e) => {
                                const newRules = [...deviceRules];
                                newRules[idx].url = e.target.value;
                                setDeviceRules(newRules);
                              }}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg text-sm px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                            />
                            <button type="button" onClick={() => removeDeviceRule(idx)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "protection" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  
                  {/* Aegis Shield */}
                  <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isShielded} onChange={(e) => setIsShielded(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Aegis Shield Compliance Engine</span>
                        </h3>
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                          When active, this link routes through our ML-powered bot detection and compliance scanner. It prevents scraping, blocks malicious IPs, and enforces rate limiting automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Password Protection</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-500" />
                        </div>
                        <input 
                          type="password" 
                          placeholder="Leave blank for none"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Requires visitors to enter a password.</p>
                    </div>

                    {/* Expiration */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Expiration Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Clock className="h-4 w-4 text-slate-500" />
                        </div>
                        <input 
                          type="datetime-local" 
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Link disables automatically after this time.</p>
                    </div>

                    {/* Click Limit */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Maximum Clicks</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Activity className="h-4 w-4 text-slate-500" />
                        </div>
                        <input 
                          type="number" 
                          min="1"
                          placeholder="e.g. 1000 (leave blank for unlimited)"
                          value={clickLimit}
                          onChange={(e) => setClickLimit(e.target.value)}
                          className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

              {activeTab === "metadata" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
                    <p className="text-sm text-slate-400">
                      Override the metadata that appears when this link is shared on social media (Twitter, LinkedIn, Facebook).
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Meta Title</label>
                    <input 
                      type="text" 
                      placeholder="My Awesome Product Launch"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Meta Description</label>
                    <textarea 
                      rows={3}
                      placeholder="A short description of what people will find when they click this link..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Open Graph Image URL</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/image.png"
                      value={metaImageUrl}
                      onChange={(e) => setMetaImageUrl(e.target.value)}
                      className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                    {metaImageUrl && (
                      <div className="mt-4 p-2 bg-slate-900 border border-slate-800 rounded-lg inline-block">
                        <img src={metaImageUrl} alt="Preview" className="max-h-32 rounded object-cover" onError={(e) => e.currentTarget.style.display='none'} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end space-x-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-link-form"
            disabled={isLoading || (slug !== "" && isSlugAvailable === false)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center space-x-2 text-sm font-bold text-white border border-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Create Routing Pathway</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
