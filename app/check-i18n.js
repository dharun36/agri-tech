#!/usr/bin/env node

// Script to check which components need i18n support
// This helps identify components with hardcoded strings

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, 'src', 'components');
const excludeFiles = ['DocumentTitleHandler.jsx', 'ErrorBoundary.jsx', 'PageTransition.jsx'];

// Common hardcoded strings to look for
const hardcodedPatterns = [
  /["'](?:Home|Dashboard|Profile|Tasks|Crops|Market|Weather|Disease|Login|Register|Save|Cancel|Delete|Edit|Loading|Error|Success)["']/g,
  /title=["'][^"']*["']/g,
  /placeholder=["'][^"']*["']/g,
  />[\s]*[A-Z][a-zA-Z\s]{3,}[\s]*</g
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Check if file has useTranslation import
    const hasI18n = content.includes('useTranslation');
    
    // Find hardcoded strings
    const hardcodedStrings = [];
    hardcodedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        hardcodedStrings.push(...matches);
      }
    });
    
    return {
      fileName,
      hasI18n,
      hardcodedStrings: [...new Set(hardcodedStrings)].slice(0, 5) // Limit to 5 examples
    };
  } catch (error) {
    return null;
  }
}

function scanComponents() {
  try {
    const files = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.jsx') && !excludeFiles.includes(file));
    
    console.log('🔍 Scanning components for i18n support...\n');
    
    files.forEach(file => {
      const filePath = path.join(componentsDir, file);
      const result = scanFile(filePath);
      
      if (result) {
        const status = result.hasI18n ? '✅' : '❌';
        console.log(`${status} ${result.fileName}`);
        
        if (!result.hasI18n && result.hardcodedStrings.length > 0) {
          console.log('   Hardcoded strings found:');
          result.hardcodedStrings.forEach(str => {
            console.log(`   - ${str.substring(0, 50)}...`);
          });
        }
        console.log('');
      }
    });
  } catch (error) {
    console.error('Error scanning components:', error.message);
  }
}

scanComponents();