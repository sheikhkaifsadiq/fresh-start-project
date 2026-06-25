const fs = require('fs');

const files = [
  'src/components/links/LinkFilters.tsx',
  'src/components/links/QRCodeGenerator.tsx',
  'src/components/security/ThreatIntelligenceFeed.tsx',
  'src/components/security/WafLogViewer.tsx',
  'src/components/settings/BillingSettings.tsx',
  'src/components/settings/MLModelConfig.tsx',
  'src/components/settings/NotificationPreferences.tsx',
  'src/components/settings/RateLimitingSettings.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    // Find the first lucide-react import
    c = c.replace(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g, "import {$1, Database, Shield, AlertCircle, Clock, Activity, Info, CreditCard, CheckCircle2} from 'lucide-react'");
    fs.writeFileSync(f, c);
  }
});
