#!/usr/bin/env node

/**
 * Bundle Analysis Script for Core Web Vitals Optimization
 * Run with: node scripts/analyze-bundle.js
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Bundle Analysis for Core Web Vitals Optimization\n');

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.log('❌ .next directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Analyze bundle sizes
const staticDir = path.join(nextDir, 'static');
const chunksDir = path.join(staticDir, 'chunks');

if (fs.existsSync(chunksDir)) {
  console.log('📦 JavaScript Bundle Sizes:');
  console.log('=' .repeat(50));
  
  const chunkFiles = fs.readdirSync(chunksDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      return { file, size: stats.size, sizeKB };
    })
    .sort((a, b) => b.size - a.size);

  let totalSize = 0;
  chunkFiles.forEach(({ file, sizeKB }) => {
    totalSize += parseFloat(sizeKB);
    console.log(`${file.padEnd(40)} ${sizeKB.padStart(8)} KB`);
  });

  console.log('-'.repeat(50));
  console.log(`Total Bundle Size: ${totalSize.toFixed(2)} KB`);
  
  // Performance recommendations
  console.log('\n🚀 Performance Recommendations:');
  console.log('=' .repeat(50));
  
  if (totalSize > 500) {
    console.log('⚠️  Large bundle detected (>500KB)');
    console.log('   • Consider code splitting');
    console.log('   • Remove unused dependencies');
    console.log('   • Use dynamic imports for heavy components');
  }
  
  const largeChunks = chunkFiles.filter(chunk => parseFloat(chunk.sizeKB) > 100);
  if (largeChunks.length > 0) {
    console.log('\n📦 Large chunks detected (>100KB):');
    largeChunks.forEach(chunk => {
      console.log(`   • ${chunk.file} (${chunk.sizeKB} KB)`);
    });
  }
  
  console.log('\n✅ Optimizations Applied:');
  console.log('   • Image optimization with next/image');
  console.log('   • Font optimization with next/font');
  console.log('   • Lazy loading for admin components');
  console.log('   • Bundle splitting configuration');
  console.log('   • Reduced font weights');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Monitor Core Web Vitals with Lighthouse');
  console.log('   2. Test on slow 3G connections');
  console.log('   3. Consider implementing service worker');
  console.log('   4. Add performance budgets to CI/CD');
  
} else {
  console.log('❌ Chunks directory not found. Build may have failed.');
} 