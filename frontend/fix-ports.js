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
      content = content.replace(/http:\/\/localhost:8080/g, 'http://localhost:4004');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed port 8080 to 4004:', filePath);
    }
  }
});
