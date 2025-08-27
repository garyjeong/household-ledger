#!/bin/bash

# 보안 점검 스크립트
# 로컬 개발 환경에서 보안 취약점을 점검하는 스크립트

set -e

echo "🔒 Starting security check..."
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장 디렉토리
SECURITY_DIR="./security-reports"
mkdir -p "$SECURITY_DIR"

# 1. 의존성 보안 감사
echo -e "${BLUE}📦 Running dependency security audit...${NC}"
if pnpm audit --audit-level moderate --json > "$SECURITY_DIR/audit.json" 2>/dev/null; then
    echo -e "${GREEN}✅ No vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠️ Vulnerabilities detected - check $SECURITY_DIR/audit.json${NC}"
fi

# 2. 고위험 의존성 패턴 검사
echo -e "${BLUE}🚨 Checking for high-risk dependency patterns...${NC}"
RISKY_PATTERNS=(
    "eval"
    "unsafe-eval"
    "node-serialize"
    "serialize-javascript"
    "lodash.*template"
    "handlebars.*compile"
)

RISK_FOUND=false
for pattern in "${RISKY_PATTERNS[@]}"; do
    if grep -r "$pattern" package.json pnpm-lock.yaml 2>/dev/null | grep -v "grep"; then
        echo -e "${RED}⚠️ Potentially risky pattern found: $pattern${NC}"
        RISK_FOUND=true
    fi
done

if [ "$RISK_FOUND" = false ]; then
    echo -e "${GREEN}✅ No high-risk patterns found${NC}"
fi

# 3. 라이센스 검사
echo -e "${BLUE}📜 Checking license compliance...${NC}"
if command -v license-checker >/dev/null 2>&1; then
    if license-checker --summary --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;Unlicense;CC0-1.0' > "$SECURITY_DIR/licenses.txt" 2>&1; then
        echo -e "${GREEN}✅ All licenses are compliant${NC}"
    else
        echo -e "${YELLOW}⚠️ License issues found - check $SECURITY_DIR/licenses.txt${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ license-checker not installed. Installing...${NC}"
    npm install -g license-checker
fi

# 4. 환경 변수 보안 검사
echo -e "${BLUE}🔑 Checking environment variable security...${NC}"
ENV_ISSUES=false

# .env 파일들에서 실제 시크릿이 하드코딩되었는지 검사
for env_file in .env .env.local .env.development .env.production; do
    if [ -f "$env_file" ]; then
        # 실제 값처럼 보이는 패턴 검사 (예: 32자 이상의 랜덤 문자열)
        if grep -E "=(.*[A-Za-z0-9]{32,}.*)" "$env_file" | grep -v "your_" | grep -v "example_" | grep -v "placeholder"; then
            echo -e "${RED}⚠️ Potential hardcoded secrets in $env_file${NC}"
            ENV_ISSUES=true
        fi
    fi
done

if [ "$ENV_ISSUES" = false ]; then
    echo -e "${GREEN}✅ No environment variable issues found${NC}"
fi

# 5. 코드에서 민감한 정보 누출 검사
echo -e "${BLUE}🔍 Scanning code for sensitive information...${NC}"
SENSITIVE_PATTERNS=(
    "password.*=.*['\"][^'\"]{8,}['\"]"
    "secret.*=.*['\"][^'\"]{16,}['\"]"
    "token.*=.*['\"][^'\"]{20,}['\"]"
    "api.*key.*=.*['\"][^'\"]{20,}['\"]"
    "private.*key"
    "BEGIN.*PRIVATE.*KEY"
)

SENSITIVE_FOUND=false
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "$pattern" {} \; 2>/dev/null; then
        echo -e "${RED}⚠️ Potential sensitive information in code: $pattern${NC}"
        SENSITIVE_FOUND=true
    fi
done

if [ "$SENSITIVE_FOUND" = false ]; then
    echo -e "${GREEN}✅ No sensitive information found in code${NC}"
fi

# 6. Next.js 보안 설정 검사
echo -e "${BLUE}⚙️ Checking Next.js security configuration...${NC}"
NEXTJS_ISSUES=false

# next.config.ts 보안 설정 확인
if [ -f "next.config.ts" ]; then
    # HTTP 헤더 보안 설정 확인
    if ! grep -q "X-Frame-Options\|X-Content-Type-Options\|X-XSS-Protection" next.config.ts; then
        echo -e "${YELLOW}⚠️ Consider adding security headers in next.config.ts${NC}"
        NEXTJS_ISSUES=true
    fi
    
    # HTTPS 강제 설정 확인 (프로덕션)
    if ! grep -q "secure.*true\|forceSSL\|HTTPS" next.config.ts; then
        echo -e "${YELLOW}ℹ️ Consider enabling HTTPS enforcement for production${NC}"
    fi
fi

if [ "$NEXTJS_ISSUES" = false ]; then
    echo -e "${GREEN}✅ Next.js security configuration looks good${NC}"
fi

# 7. 의존성 업데이트 권장사항
echo -e "${BLUE}📈 Checking for outdated dependencies...${NC}"
if pnpm outdated > "$SECURITY_DIR/outdated.txt" 2>/dev/null; then
    echo -e "${YELLOW}ℹ️ Some dependencies can be updated - check $SECURITY_DIR/outdated.txt${NC}"
else
    echo -e "${GREEN}✅ All dependencies are up to date${NC}"
fi

# 8. 번들 분석 (빌드가 있는 경우)
echo -e "${BLUE}📦 Analyzing build bundle (if available)...${NC}"
if [ -d ".next" ]; then
    # 큰 번들 파일 찾기
    find .next -name "*.js" -size +1M -exec echo -e "${YELLOW}⚠️ Large bundle file: {}${NC}" \; 2>/dev/null || true
    
    # 소스맵에서 민감한 정보 검사
    if find .next -name "*.map" -exec grep -l "password\|secret\|token\|key" {} \; 2>/dev/null | head -1; then
        echo -e "${RED}⚠️ Sensitive information found in source maps!${NC}"
    else
        echo -e "${GREEN}✅ No sensitive information in source maps${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️ No build directory found. Run 'pnpm run build' first for bundle analysis${NC}"
fi

# 9. 보안 보고서 생성
echo -e "${BLUE}📊 Generating security report...${NC}"
cat > "$SECURITY_DIR/security-report.md" << EOF
# 🔒 Security Check Report

**Generated:** $(date)
**Project:** 우리가족가계부 (Household Ledger)

## Summary

### Dependency Security
- **Audit Status:** $(if [ -s "$SECURITY_DIR/audit.json" ]; then echo "⚠️ Issues found"; else echo "✅ Clean"; fi)
- **High-risk Patterns:** $(if [ "$RISK_FOUND" = true ]; then echo "⚠️ Found"; else echo "✅ None"; fi)

### Code Security
- **Sensitive Information:** $(if [ "$SENSITIVE_FOUND" = true ]; then echo "⚠️ Found"; else echo "✅ Clean"; fi)
- **Environment Variables:** $(if [ "$ENV_ISSUES" = true ]; then echo "⚠️ Issues"; else echo "✅ Secure"; fi)

### Configuration
- **Next.js Security:** $(if [ "$NEXTJS_ISSUES" = true ]; then echo "⚠️ Improvements needed"; else echo "✅ Good"; fi)
- **License Compliance:** ✅ Checked

## Recommendations

1. **Keep dependencies updated** - Use Dependabot for automated updates
2. **Regular security audits** - Run this script before each release
3. **Environment security** - Never commit real secrets to version control
4. **Code review** - Review all code changes for security implications
5. **Monitor advisories** - Subscribe to security advisories for used packages

## Files Generated

- \`audit.json\` - Dependency vulnerability details
- \`licenses.txt\` - License compliance report
- \`outdated.txt\` - Outdated dependencies list
- \`security-report.md\` - This report

## Next Steps

$(if [ "$RISK_FOUND" = true ] || [ "$SENSITIVE_FOUND" = true ] || [ "$ENV_ISSUES" = true ]; then
echo "⚠️ **Action Required:** Review and fix the issues mentioned above"
else
echo "✅ **All Clear:** No immediate security issues found"
fi)

EOF

echo "=================================="
echo -e "${GREEN}🔒 Security check completed!${NC}"
echo -e "${BLUE}📁 Reports saved in: $SECURITY_DIR/${NC}"
echo "=================================="

# 요약 출력
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   Dependencies: $(if [ -s "$SECURITY_DIR/audit.json" ]; then echo -e "${YELLOW}Issues found${NC}"; else echo -e "${GREEN}Clean${NC}"; fi)"
echo -e "   Code Security: $(if [ "$SENSITIVE_FOUND" = true ]; then echo -e "${YELLOW}Issues found${NC}"; else echo -e "${GREEN}Clean${NC}"; fi)"
echo -e "   Configuration: $(if [ "$NEXTJS_ISSUES" = true ]; then echo -e "${YELLOW}Improvements needed${NC}"; else echo -e "${GREEN}Good${NC}"; fi)"

# 전체 결과에 따른 종료 코드
if [ "$RISK_FOUND" = true ] || [ "$SENSITIVE_FOUND" = true ] || [ "$ENV_ISSUES" = true ]; then
    echo -e "${YELLOW}⚠️ Some issues found - please review the report${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All security checks passed${NC}"
    exit 0
fi
