import { Project, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement, CallExpression } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");
const BRAIN_DIR = path.join(ROOT_DIR, "project-brain");
const GRAPH_NODES = path.join(BRAIN_DIR, "graph", "nodes.json");
const GRAPH_EDGES = path.join(BRAIN_DIR, "graph", "edges.json");
const GRAPH_INDEX = path.join(BRAIN_DIR, "graph", "graph-index.json");
const SEARCH_INDEX = path.join(BRAIN_DIR, "search-index.json");

// Read arguments (files changed)
const changedFiles = process.argv.slice(2);
if (changedFiles.length === 0) {
  console.log("[Project Brain Updater] No files specified. Usage: npx tsx scripts/update-project-brain.ts <file1> <file2>...");
  process.exit(0);
}

console.log("[Project Brain Updater] Updating project brain for changed files:", changedFiles);

// Load existing files
let nodes: any[] = [];
let edges: any[] = [];
let searchIndex: any[] = [];

if (fs.existsSync(GRAPH_NODES)) nodes = JSON.parse(fs.readFileSync(GRAPH_NODES, "utf-8"));
if (fs.existsSync(GRAPH_EDGES)) edges = JSON.parse(fs.readFileSync(GRAPH_EDGES, "utf-8"));
if (fs.existsSync(SEARCH_INDEX)) searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX, "utf-8"));

// Initialize TS Project
const project = new Project({
  tsConfigFilePath: path.join(ROOT_DIR, "tsconfig.json"),
});

// Resolve imports helper
function resolveImportPath(currentFile: string, specifier: string): string | null {
  if (!specifier) return null;
  let resolved: string = "";
  if (specifier.startsWith("@/")) {
    resolved = path.join(SRC_DIR, specifier.substring(2));
  } else if (specifier.startsWith(".")) {
    resolved = path.resolve(path.dirname(path.join(ROOT_DIR, currentFile)), specifier);
  } else {
    return null;
  }

  const extensions = [".tsx", ".ts", "/index.tsx", "/index.ts"];
  for (const ext of extensions) {
    const fullPath = resolved + ext;
    if (fs.existsSync(fullPath)) {
      return path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");
    }
  }
  return null;
}

function determineType(filePath: string, name?: string): string {
  if (filePath.includes("routes/api/")) return "api route";
  if (filePath.includes("routes/")) return "route";
  if (filePath.includes("stores/")) return "zustand store";
  if (filePath.includes("supabase/")) return "supabase integration";
  if (name) {
    if (name.startsWith("use")) return "hook";
    if (name.includes("Provider") || name.includes("Context")) return "context";
    if (name[0] === name[0].toUpperCase()) return "component";
  }
  if (filePath.includes("lib/")) return "shared utility";
  return "module";
}

// Process each changed file
changedFiles.forEach(file => {
  const normFile = file.replace(/\\/g, "/").replace(/^\//, "");
  const fullPath = path.join(ROOT_DIR, normFile);
  if (!fs.existsSync(fullPath)) {
    console.log(`[Project Brain Updater] File does not exist: ${normFile}, skipping.`);
    return;
  }

  console.log(`[Project Brain Updater] Re-analyzing AST for: ${normFile}`);

  // 1. Remove old nodes and edges associated with this file path
  nodes = nodes.filter(n => n.path !== normFile && n.id !== normFile);
  edges = edges.filter(e => e.from !== normFile && !e.from.startsWith(normFile + "#"));
  searchIndex = searchIndex.filter(idx => idx.path !== normFile && idx.id !== normFile);

  // 2. Add file to project and parse
  try {
    const sf = project.addSourceFileAtPath(fullPath);
    
    // Create new node
    const fileType = determineType(normFile);
    const fileNode = {
      id: normFile,
      type: "file",
      name: path.basename(normFile),
      path: normFile,
      exports: [] as string[],
      imports: [] as string[],
      dependsOn: [] as string[],
      referencedBy: [] as string[],
      tags: ["file", fileType],
      lastUpdated: new Date().toISOString(),
      summary: `Source file for ${fileType} layer: ${normFile}`
    };

    // Analyze Exports
    sf.getExportedDeclarations().forEach((declarations, name) => {
      fileNode.exports.push(name);
      const exportType = determineType(normFile, name);
      const exportId = `${normFile}#${name}`;

      nodes.push({
        id: exportId,
        type: exportType,
        name: name,
        path: normFile,
        exports: [],
        imports: [],
        dependsOn: [normFile],
        referencedBy: [],
        tags: [exportType, "export"],
        lastUpdated: new Date().toISOString(),
        summary: `Exported ${exportType} '${name}' defined in ${normFile}`
      });

      edges.push({
        from: normFile,
        to: exportId,
        type: "imports"
      });

      searchIndex.push({
        id: exportId,
        name: name,
        type: exportType,
        path: normFile,
        keywords: [name, exportType, path.basename(normFile)],
        tags: [exportType, "export"],
        summary: `Exported ${exportType} '${name}' defined in ${normFile}`,
        aliases: [name.toLowerCase()]
      });
    });

    // Analyze Imports
    sf.getImportDeclarations().forEach(impDecl => {
      const specifier = impDecl.getModuleSpecifierValue();
      const resolvedPath = resolveImportPath(normFile, specifier);
      if (resolvedPath) {
        fileNode.imports.push(resolvedPath);
        edges.push({
          from: normFile,
          to: resolvedPath,
          type: "imports"
        });

        impDecl.getNamedImports().forEach(namedImp => {
          const importName = namedImp.getName();
          edges.push({
            from: normFile,
            to: `${resolvedPath}#${importName}`,
            type: "imports"
          });
        });
      }
    });

    // Rendered Components Analysis
    const jsxOpenings = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement) as JsxOpeningElement[];
    const jsxSelfClosing = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement) as JsxSelfClosingElement[];
    const allJsx = [...jsxOpenings, ...jsxSelfClosing];

    allJsx.forEach(jsx => {
      const tagName = jsx.getTagNameNode().getText();
      if (tagName[0] === tagName[0].toUpperCase()) {
        sf.getImportDeclarations().forEach(impDecl => {
          const specifier = impDecl.getModuleSpecifierValue();
          const resolvedPath = resolveImportPath(normFile, specifier);
          if (resolvedPath) {
            impDecl.getNamedImports().forEach(namedImp => {
              if (namedImp.getName() === tagName) {
                edges.push({
                  from: normFile,
                  to: `${resolvedPath}#${tagName}`,
                  type: "renders"
                });
              }
            });
          }
        });
      }
    });

    // Hook Analysis
    const callExpressions = sf.getDescendantsOfKind(SyntaxKind.CallExpression) as CallExpression[];
    callExpressions.forEach(call => {
      const identifier = call.getExpression().getText();
      if (identifier.startsWith("use")) {
        sf.getImportDeclarations().forEach(impDecl => {
          const specifier = impDecl.getModuleSpecifierValue();
          const resolvedPath = resolveImportPath(normFile, specifier);
          if (resolvedPath) {
            impDecl.getNamedImports().forEach(namedImp => {
              if (namedImp.getName() === identifier) {
                edges.push({
                  from: normFile,
                  to: `${resolvedPath}#${identifier}`,
                  type: "uses hook"
                });
              }
            });
          }
        });
      }
    });

    nodes.push(fileNode);
    searchIndex.push({
      id: normFile,
      name: path.basename(normFile),
      type: "file",
      path: normFile,
      keywords: [path.basename(normFile), "file", fileType],
      tags: ["file", fileType],
      summary: `Source file for ${fileType} layer: ${normFile}`,
      aliases: [path.basename(normFile).toLowerCase()]
    });

  } catch (err) {
    console.error(`[Project Brain Updater] Error parsing ${normFile}:`, err);
  }
});

// Recompute dependencies for all nodes
nodes.forEach(node => {
  const directDepends = edges.filter(e => e.from === node.id).map(e => e.to);
  const directReferenced = edges.filter(e => e.to === node.id).map(e => e.from);
  node.dependsOn = Array.from(new Set(directDepends));
  node.referencedBy = Array.from(new Set(directReferenced));
});

// Save updated files
fs.writeFileSync(GRAPH_NODES, JSON.stringify(nodes, null, 2));
fs.writeFileSync(GRAPH_EDGES, JSON.stringify(edges, null, 2));
fs.writeFileSync(SEARCH_INDEX, JSON.stringify(searchIndex, null, 2));

// Update index status
fs.writeFileSync(GRAPH_INDEX, JSON.stringify({
  totalNodes: nodes.length,
  totalEdges: edges.length,
  lastIndexed: new Date().toISOString()
}, null, 2));

// Append to changelog
const changelogPath = path.join(BRAIN_DIR, "tasks", "changelog.md");
let changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf-8") : "";
changelog += `\n- **Incremental AST Update**: Re-evaluated ${changedFiles.join(", ")} on ${new Date().toISOString()}.\n`;
fs.writeFileSync(changelogPath, changelog);

console.log("[Project Brain Updater] Incremental sync complete.");
