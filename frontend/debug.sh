#!/bin/bash

echo "🔍 Debugging file structure and imports..."

echo "📁 Checking project structure:"
echo "Current directory: $(pwd)"
echo ""

echo "📂 src/ directory contents:"
ls -la src/ 2>/dev/null || echo "❌ src/ directory not found"
echo ""

echo "📂 src/lib/ directory contents:"
ls -la src/lib/ 2>/dev/null || echo "❌ src/lib/ directory not found"
echo ""

echo "📂 src/app/ directory contents:"
ls -la src/app/ 2>/dev/null || echo "❌ src/app/ directory not found"
echo ""

echo "📂 src/components/ui/ directory contents:"
ls -la src/components/ui/ 2>/dev/null || echo "❌ src/components/ui/ directory not found"
echo ""

echo "🔍 Checking specific files:"
echo "api.ts exists: $([ -f src/lib/api.ts ] && echo '✅ YES' || echo '❌ NO')"
echo "utils.ts exists: $([ -f src/lib/utils.ts ] && echo '✅ YES' || echo '❌ NO')"
echo "login page exists: $([ -f src/app/login/page.tsx ] && echo '✅ YES' || echo '❌ NO')"
echo ""

echo "📄 First few lines of src/lib/api.ts:"
head -5 src/lib/api.ts 2>/dev/null || echo "❌ Cannot read src/lib/api.ts"
echo ""

echo "📄 Import statements in login page:"
grep -n "import.*lib" src/app/login/page.tsx 2>/dev/null || echo "❌ Cannot find import statements"
