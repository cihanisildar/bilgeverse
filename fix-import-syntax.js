const fs = require('fs');
const path = require('path');

// List of files to check - use all API routes
const rootDir = 'app/api';

function getAllTsFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      results = results.concat(getAllTsFiles(fullPath));
    } else if (item.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

function fixImportSyntaxErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for problematic import with empty first item
    if (content.includes('import {,') || content.includes('import { ,')) {
      console.log(`Found syntax error in ${filePath}`);
      
      // Fix the import statement
      const updatedContent = content.replace(
        /import \{\s*,\s*([^}]*)\}\s*from\s*['"]@\/lib\/auth['"]/g,
        (match, imports) => {
          return `import { ${imports.trim()} } from '@/lib/auth'`;
        }
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ Fixed syntax error in ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

try {
  const apiFiles = getAllTsFiles(rootDir);
  console.log(`Found ${apiFiles.length} TypeScript files in API directory`);
  
  let fixedCount = 0;
  
  for (const file of apiFiles) {
    if (fixImportSyntaxErrors(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed syntax errors in ${fixedCount} files`);
} catch (error) {
  console.error('Error running script:', error);
} 