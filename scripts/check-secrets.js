#!/usr/bin/env node

const fs = require('fs');
// const path = require('path');

// 검사할 패턴 정의
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'high',
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws_secret_access_key\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,
    severity: 'high',
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'API Key (Generic)',
    pattern:
      /(api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi,
    severity: 'high',
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'medium',
  },
  {
    name: 'Database URL',
    pattern: /(mongodb|mysql|postgresql|postgres):\/\/[^\s'"]+/gi,
    severity: 'high',
  },
  {
    name: 'Password in Code',
    pattern: /(password|passwd|pwd)\s*[:=]\s*['"][^'"\s]{8,}['"]/gi,
    severity: 'high',
  },
  {
    name: 'GitHub Token',
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    severity: 'critical',
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
    severity: 'high',
  },
];

// 제외할 패턴 (false positive 방지)
const EXCLUDE_PATTERNS = [
  /example/i,
  /sample/i,
  /dummy/i,
  /test.*key/i,
  /your[_-]?api[_-]?key/i,
  /\*{5,}/, // 마스킹된 값
  /x{5,}/i, // 마스킹된 값
];

// 파일을 검사하는 함수
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  SECRET_PATTERNS.forEach(({ name, pattern, severity }) => {
    lines.forEach((line, index) => {
      const matches = line.match(pattern);

      if (matches) {
        // False positive 체크
        const isFalsePositive = EXCLUDE_PATTERNS.some((excludePattern) =>
          excludePattern.test(line),
        );

        if (!isFalsePositive) {
          findings.push({
            file: filePath,
            line: index + 1,
            type: name,
            severity: severity,
            preview: line.trim().substring(0, 100),
          });
        }
      }
    });
  });

  return findings;
}

// 메인 실행 함수
function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log('✓ No files to check');
    return;
  }

  let hasSecrets = false;
  const allFindings = [];

  files.forEach((file) => {
    if (fs.existsSync(file)) {
      const findings = checkFile(file);
      if (findings.length > 0) {
        hasSecrets = true;
        allFindings.push(...findings);
      }
    }
  });

  if (hasSecrets) {
    console.error('\n❌ SECURITY ALERT: Potential secrets detected!\n');

    // Severity별로 그룹화
    const grouped = allFindings.reduce((acc, finding) => {
      if (!acc[finding.severity]) {
        acc[finding.severity] = [];
      }
      acc[finding.severity].push(finding);
      return acc;
    }, {});

    // Critical 먼저, 그 다음 High, Medium 순서로 출력
    ['critical', 'high', 'medium'].forEach((severity) => {
      if (grouped[severity]) {
        console.error(`\n🚨 ${severity.toUpperCase()} SEVERITY:`);
        grouped[severity].forEach((finding) => {
          console.error(`  File: ${finding.file}:${finding.line}`);
          console.error(`  Type: ${finding.type}`);
          console.error(`  Preview: ${finding.preview}`);
          console.error('');
        });
      }
    });

    console.error('⚠️  Please remove sensitive data before committing.\n');
    console.error('💡 Tips:');
    console.error('   - Use environment variables (.env files)');
    console.error('   - Add sensitive files to .gitignore');
    console.error(
      '   - Use secret management tools (AWS Secrets Manager, etc.)',
    );
    console.error('   - Never commit real credentials\n');

    process.exit(1);
  }

  console.log('✓ No secrets detected in staged files');
}

main();
