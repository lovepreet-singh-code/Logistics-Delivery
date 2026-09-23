const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('g:/Love Project (Backend)/Logistics Delivery/frontend/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if 'use client' or "use client" exists
    if (content.includes('"use client"') || content.includes("'use client'")) {
      const lines = content.split('\n');
      let useClientIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
          useClientIndex = i;
          break;
        }
      }

      if (useClientIndex > 0) {
        // Find if there are imports before "use client"
        let hasImportsBefore = false;
        for (let i = 0; i < useClientIndex; i++) {
          if (lines[i].trim().startsWith('import ')) {
            hasImportsBefore = true;
            break;
          }
        }

        if (hasImportsBefore) {
          // Remove the "use client" line from its current position
          const useClientLine = lines.splice(useClientIndex, 1)[0];
          // Insert it at the very top
          lines.unshift(useClientLine);
          
          fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
          console.log('Fixed "use client" in:', filePath);
        }
      }
    }
  }
});
