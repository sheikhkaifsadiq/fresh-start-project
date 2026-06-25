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
    
    // Find the import statement for lucide-react
    const regex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
    
    c = c.replace(regex, (match, p1) => {
      // p1 is the list of imports. Split by comma, trim, and put in a Set to deduplicate
      const imports = p1.split(',').map(s => s.trim()).filter(Boolean);
      const uniqueImports = new Set(imports);
      
      // The extra imports we appended earlier that caused duplicates
      // (We already have them in the set if they were present, so Set handles dedup)
      
      return `import { ${Array.from(uniqueImports).join(', ')} } from 'lucide-react'`;
    });

    fs.writeFileSync(f, c);
    console.log('Deduplicated imports in', f);
  }
});
