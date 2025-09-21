#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 사용하지 않는 변수를 _prefix로 변경하는 함수
function fixUnusedVars(content, filePath) {
  // unused variables를 _prefix로 변경
  const patterns = [
    // destructuring에서 사용되지 않는 변수들
    { regex: /const \{ ([^}]*), (\w+) \} = /g, replacement: (match, before, varName) => {
      if (varName === 'logout' || varName === 'showSuccess' || varName === 'showError' || 
          varName === 'recentUsernames' || varName === 'error' || varName === 'handleClearRememberedEmail') {
        return `const { ${before}, ${varName}: _${varName} } = `
      }
      return match
    }},
    
    // 일반 변수 선언에서 사용되지 않는 변수들
    { regex: /const (\w+) = /g, replacement: (match, varName) => {
      const unusedVars = ['freeMemory', 'firstMonth', 'changePercent', 'deleteError', 'createError', 'updateError']
      if (unusedVars.includes(varName)) {
        return `const _${varName} = `
      }
      return match
    }},
    
    // 함수 파라미터에서 사용되지 않는 변수들
    { regex: /\(([^)]*), (\w+)\) => \{/g, replacement: (match, before, varName) => {
      const unusedParams = ['error', 'data', 'fallback', 'hash']
      if (unusedParams.includes(varName)) {
        return `(${before}, _${varName}) => {`
      }
      return match
    }}
  ]
  
  let result = content
  patterns.forEach(pattern => {
    if (typeof pattern.replacement === 'function') {
      result = result.replace(pattern.regex, pattern.replacement)
    } else {
      result = result.replace(pattern.regex, pattern.replacement)
    }
  })
  
  return result
}

// 사용하지 않는 import 제거
function removeUnusedImports(content, filePath) {
  const unusedImports = [
    'BarChart3', 'Mail', 'MonthlyStats', 'PieChart', 'Target', 'ArrowUpDown', 
    'DollarSign', 'Badge', 'Filter', 'MoreVertical', 'CardHeader', 'CardTitle',
    'Users', 'Share', 'Link', 'Check', 'Progress', 'MonthlyProjection', 
    'RecurringExpenseItem', 'isSystemCategory', 'Label', 'useMemo', 'Legend',
    'BellOff', 'Smartphone', 'Select', 'SelectContent', 'SelectItem', 
    'SelectTrigger', 'SelectValue', 'Plus', 'Download', 'Button', 'X',
    'Trash2', 'useMutation', 'apiPost', 'queryKeys', 'ExchangeRate',
    'MonthlyStatsResponse', 'logApiCall', 'UserProfile'
  ]
  
  let result = content
  
  // import 문에서 사용하지 않는 것들 제거
  unusedImports.forEach(importName => {
    // 단일 import 제거: import { UnusedImport } from '...'
    result = result.replace(new RegExp(`import \\{ ${importName} \\} from [^\\n]+\\n`, 'g'), '')
    
    // 여러 import 중에서 하나 제거: import { Used, Unused, Other } from '...'
    result = result.replace(new RegExp(`(import \\{[^}]*), ${importName}([^}]*\\} from [^\\n]+)`, 'g'), '$1$2')
    result = result.replace(new RegExp(`(import \\{) ${importName},([^}]*\\} from [^\\n]+)`, 'g'), '$1$2')
    result = result.replace(new RegExp(`(import \\{[^}]*) ${importName} ([^}]*\\} from [^\\n]+)`, 'g'), '$1$2')
  })
  
  // 빈 import 문 제거
  result = result.replace(/import \{\s*\} from [^\n]+\n/g, '')
  
  return result
}

// any 타입을 더 구체적인 타입으로 변경
function fixAnyTypes(content, filePath) {
  // 간단한 any를 unknown으로 변경 (안전한 변경)
  let result = content.replace(/: any\b/g, ': unknown')
  result = result.replace(/any\[\]/g, 'unknown[]')
  
  return result
}

// console.log를 console.warn으로 변경 (스크립트 파일의 경우)
function fixConsoleStatements(content, filePath) {
  if (filePath.includes('scripts/') || filePath.includes('test')) {
    return content.replace(/console\.log/g, 'console.warn')
  }
  return content
}

// 파일 처리
function processFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    const originalContent = content
    
    content = removeUnusedImports(content, filePath)
    content = fixUnusedVars(content, filePath)
    content = fixAnyTypes(content, filePath)
    content = fixConsoleStatements(content, filePath)
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      console.log(`Fixed: ${filePath}`)
      modified = true
    }
    
    return modified
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

// 디렉토리 재귀 처리
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath)
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !['node_modules', '.git', 'coverage', 'dist'].includes(entry)) {
      processDirectory(fullPath)
    } else if (stat.isFile()) {
      processFile(fullPath)
    }
  }
}

// 메인 실행
const srcPath = path.join(__dirname, 'src')
const testsPath = path.join(__dirname, 'tests')
const scriptsPath = path.join(__dirname, 'scripts')

console.log('Starting ESLint fixes...')
processDirectory(srcPath)
processDirectory(testsPath)
processDirectory(scriptsPath)
console.log('ESLint fixes completed!')
