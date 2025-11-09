/**
 * AUTOMATED TYPESCRIPT TYPE GUARD FIX SCRIPT
 * Fixes all ~30 files with type guard pattern issues
 * Execution time: ~2 minutes
 * 
 * Pattern to fix:
 * FROM: if (result.error) { ... }
 * TO:   if ('error' in result && result.error) { ... }
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');

/**
 * Fix type guards in content
 */
function fixTypeGuards(content) {
  let modified = content;
  let changes = 0;

  // Pattern 1: if (xxxRes.error) → if ('error' in xxxRes && xxxRes.error)
  const pattern1 = /if\s*\(([a-zA-Z_][a-zA-Z0-9_]*Res)\.error\)\s*\{/g;
  const matches1 = content.match(pattern1);
  if (matches1) {
    modified = modified.replace(pattern1, "if ('error' in $1 && $1.error) {");
    changes += matches1.length;
  }

  // Pattern 2: if (result.error) → if ('error' in result && result.error)
  const pattern2 = /if\s*\(result\.error\)\s*\{/g;
  const matches2 = modified.match(pattern2);
  if (matches2) {
    modified = modified.replace(pattern2, "if ('error' in result && result.error) {");
    changes += matches2.length;
  }

  // Pattern 3: } else { setXxx(xxxRes.yyy → } else if ('yyy' in xxxRes) { setXxx(xxxRes.yyy
  const pattern3 = /\}\s*else\s*\{\s*\n(\s+)set([A-Z][a-zA-Z]*)\(([a-zA-Z_][a-zA-Z0-9_]*Res)\.([a-z_][a-zA-Z0-9_]*)/g;
  const matches3 = modified.match(pattern3);
  if (matches3) {
    modified = modified.replace(pattern3, "} else if ('$4' in $3) {\n$1set$2($3.$4");
    changes += matches3.length;
  }

  // Pattern 4: if (!xxxRes.error) → if ('error' in xxxRes && xxxRes.error) { } else
  const pattern4 = /if\s*\(!\s*([a-zA-Z_][a-zA-Z0-9_]*Res)\.error\)\s*\{\s*\n(\s+)set([A-Z][a-zA-Z]*)\(\1\.([a-z_][a-zA-Z0-9_]*)/g;
  const matches4 = modified.match(pattern4);
  if (matches4) {
    modified = modified.replace(pattern4, "if ('error' in $1 && $1.error) {\n$2setError($1.error)\n$2} else if ('$4' in $1) {\n$2set$3($1.$4");
    changes += matches4.length;
  }

  return { content: modified, changes };
}

// File patterns to process
const FILE_PATTERNS = [
  'src/app/customer/**/*.tsx',
  'src/app/helper/**/*.tsx',
  'src/app/admin/**/*.tsx',
];

// Statistics
let stats = {
  filesScanned: 0,
  filesModified: 0,
  patternsFixed: 0,
  errors: [],
};

/**
 * Recursively get all .tsx files in a directory
 */
function getTsxFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Fix type guards in a single file
 */
function fixTypeGuardsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, changes } = fixTypeGuards(content);

    // Write back if modified
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      stats.filesModified++;
      stats.patternsFixed += changes;
      console.log(`✅ Fixed ${changes} issue(s) in: ${path.relative(SRC_DIR, filePath)}`);
    }

    stats.filesScanned++;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting Automated TypeScript Type Guard Fix\n');
  console.log('Scanning directories:');
  console.log('  - src/app/customer/');
  console.log('  - src/app/helper/');
  console.log('  - src/app/admin/\n');

  const startTime = Date.now();

  // Get all .tsx files
  const customerFiles = getTsxFiles(path.join(SRC_DIR, 'app', 'customer'));
  const helperFiles = getTsxFiles(path.join(SRC_DIR, 'app', 'helper'));
  const adminFiles = getTsxFiles(path.join(SRC_DIR, 'app', 'admin'));
  
  const allFiles = [...customerFiles, ...helperFiles, ...adminFiles];

  console.log(`Found ${allFiles.length} .tsx files to process\n`);
  console.log('Processing files...\n');

  // Process each file
  for (const file of allFiles) {
    fixTypeGuardsInFile(file);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files scanned:     ${stats.filesScanned}`);
  console.log(`Files modified:    ${stats.filesModified}`);
  console.log(`Patterns fixed:    ${stats.patternsFixed}`);
  console.log(`Errors:           ${stats.errors.length}`);
  console.log(`Duration:         ${duration}s`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${path.relative(SRC_DIR, file)}: ${error}`);
    });
  }

  if (stats.filesModified > 0) {
    console.log('\n✅ Type guard fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run build');
    console.log('  2. If build passes: git add . && git commit -m "fix: TypeScript type guards"');
    console.log('  3. Deploy to production: vercel --prod');
  } else {
    console.log('\n✨ All files already have correct type guards!');
  }
}

// Run the script
main();
