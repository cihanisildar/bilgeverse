const fs = require('fs');
const path = require('path');

// List of files that need updating
const filesToUpdate = [
  'app/api/points/route.ts',
  'app/api/leaderboard/route.ts',
  'app/api/users/route.ts',
  'app/api/store/route.ts',
  'app/api/events/route.ts',
  'app/api/users/[id]/points/route.ts',
  'app/api/requests/[id]/route.ts',
  'app/api/requests/route.ts',
  'app/api/users/[id]/route.ts',
  'app/api/events/[id]/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/admin/registration-requests/route.ts'
];

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports getUserFromRequest from @/lib/auth
    if (content.includes("getUserFromRequest") && content.includes("from '@/lib/auth'")) {
      console.log(`Updating imports in ${filePath}`);
      
      // Replace import pattern
      const updatedContent = content.replace(
        /import \{([^}]*)(getUserFromRequest)([^}]*)\} from ['"]@\/lib\/auth['"]/g,
        (match, before, getUserFromRequest, after) => {
          const clientImports = `${before}${after}`.replace(/,,/g, ',').trim();
          
          // If there are no other imports, remove the import entirely
          if (clientImports === '' || clientImports === ',' || clientImports === ', ' || clientImports === ' ,') {
            return `import { getUserFromRequest } from '@/lib/server-auth'`;
          }
          
          // Otherwise, split the imports
          return `import {${clientImports}} from '@/lib/auth';\nimport { getUserFromRequest } from '@/lib/server-auth'`;
        }
      );
      
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⏩ Skipping ${filePath} (no matching import pattern)`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

// Update each file
filesToUpdate.forEach(filePath => {
  updateImportsInFile(filePath);
});

console.log('Import update script completed!'); 