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
    
    if (content.includes('localhost:8080')) {
      if (!content.includes('apiClient')) {
         content = 'import apiClient from \'@/lib/apiClient\';\n' + content;
      }

      // Replace plain string quotes: axios.get("http://localhost:8080/api/orders") -> apiClient.get("/orders")
      content = content.replace(/axios\.(get|post|put|patch|delete)\(["']http:\/\/localhost:8080\/api([^"']+)["']/g, 'apiClient.$1("$2"');
      
      // Replace template literals: axios.get(`http://localhost:8080/api/orders/${id}`) -> apiClient.get(`/orders/${id}`)
      content = content.replace(/axios\.(get|post|put|patch|delete)\(`http:\/\/localhost:8080\/api([^`]+)`/g, 'apiClient.$1(`$2`');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
