import { Project } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const ROOT_DIR = process.cwd();
const BRAIN_DIR = path.join(ROOT_DIR, "project-brain");
const GRAPH_NODES = path.join(BRAIN_DIR, "graph", "nodes.json");

// Read arguments
const changedFiles = process.argv.slice(2);
if (changedFiles.length === 0) {
  console.log("Usage: npx tsx update-project-brain.ts <file1> <file2>...");
  process.exit(0);
}

console.log("Updating graph for changed files:", changedFiles);

// Load existing nodes
let nodes: any[] = [];
if (fs.existsSync(GRAPH_NODES)) {
  nodes = JSON.parse(fs.readFileSync(GRAPH_NODES, "utf-8"));
}

const project = new Project({
  tsConfigFilePath: path.join(ROOT_DIR, "tsconfig.json"),
});

changedFiles.forEach(file => {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    project.addSourceFileAtPath(path.join(ROOT_DIR, file));
  }
});

const sourceFiles = project.getSourceFiles();

sourceFiles.forEach(sf => {
  const filePath = sf.getFilePath().replace(ROOT_DIR, "").replace(/\\/g, "/").replace(/^\//, "");
  console.log("Re-parsing:", filePath);
  
  // Remove old nodes associated with this file
  nodes = nodes.filter(n => n.path !== filePath);
  
  // Add new File node
  nodes.push({
    id: filePath,
    type: "file",
    name: path.basename(filePath),
    path: filePath,
    exports: [],
    imports: [],
    dependsOn: [],
    referencedBy: [],
    tags: [],
    lastUpdated: new Date().toISOString()
  });
});

fs.writeFileSync(GRAPH_NODES, JSON.stringify(nodes, null, 2));

console.log("Incremental update complete.");
// Update changelog and task history incrementally
const changelogPath = path.join(BRAIN_DIR, "tasks", "changelog.md");
let changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf-8") : "";
changelog += `\n- Incremental update on ${new Date().toISOString()} for ${changedFiles.length} files.\n`;
fs.writeFileSync(changelogPath, changelog);
