const fs = require('fs');

// 파일 읽기
const content = fs.readFileSync('src/app/ledger/page.tsx', 'utf8');
const lines = content.split('\n');

// 359번째 줄 다음에 중괄호 추가
lines.splice(359, 0, '      }');

// 파일 저장
fs.writeFileSync('src/app/ledger/page.tsx', lines.join('\n'));

console.log('File fixed successfully');
