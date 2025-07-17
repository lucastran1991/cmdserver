// test-imports.js - Test script to verify imports work
console.log('🧪 Testing imports...');

try {
  // Test if we can require the files
  const path = require('path');
  const fs = require('fs');
  
  console.log('📁 Current directory:', process.cwd());
  
  // Check if files exist
  const apiPath = path.join(process.cwd(), 'src', 'lib', 'api.ts');
  const utilsPath = path.join(process.cwd(), 'src', 'lib', 'utils.ts');
  
  console.log('🔍 Checking files:');
  console.log('api.ts path:', apiPath);
  console.log('api.ts exists:', fs.existsSync(apiPath) ? '✅' : '❌');
  
  console.log('utils.ts path:', utilsPath);
  console.log('utils.ts exists:', fs.existsSync(utilsPath) ? '✅' : '❌');
  
  // Test relative path resolution
  const loginPagePath = path.join(process.cwd(), 'src', 'app', 'login', 'page.tsx');
  const loginDir = path.dirname(loginPagePath);
  const relativeApiPath = path.relative(loginDir, apiPath);
  const relativeUtilsPath = path.relative(loginDir, utilsPath);
  
  console.log('📍 From login page directory:');
  console.log('Relative path to api.ts:', relativeApiPath);
  console.log('Relative path to utils.ts:', relativeUtilsPath);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
