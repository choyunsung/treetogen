#!/usr/bin/env node
// scripts/bump-version.js - 버전 증가 스크립트

const fs = require('fs');
const path = require('path');

// 현재 버전 읽기
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// 명령행 인수 처리
const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // 기본값은 patch
const customVersion = args[1]; // 사용자 지정 버전 (선택 사항)

/**
 * 버전 번호 증가
 * @param {string} version - 현재 버전 (예: 1.2.3)
 * @param {string} type - 증가 유형 (major, minor, patch)
 * @returns {string} 증가된 버전
 */
function bumpVersion(version, type) {
    const parts = version.split('.').map(Number);

    switch (type) {
        case 'major':
            return `${parts[0] + 1}.0.0`;
        case 'minor':
            return `${parts[0]}.${parts[1] + 1}.0`;
        case 'patch':
        default:
            return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
}

// 새 버전 계산
let newVersion;
if (customVersion) {
    // 사용자 지정 버전 사용
    newVersion = customVersion;
} else {
    // 자동 증가
    newVersion = bumpVersion(currentVersion, bumpType);
}

console.log(`현재 버전: ${currentVersion}`);
console.log(`새 버전: ${newVersion}`);

// package.json 업데이트
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`package.json의 버전이 ${newVersion}으로 업데이트되었습니다.`);

// 다른 파일에서 버전 업데이트 (선택 사항)
// 예: README.md, setup 스크립트 등
try {
    // README.md에서 버전 정보 업데이트
    const readmePath = path.join(__dirname, '..', 'README.md');
    if (fs.existsSync(readmePath)) {
        let readmeContent = fs.readFileSync(readmePath, 'utf8');

        // 간단한 버전 문자열 대체 (필요에 따라 정규 표현식 수정)
        readmeContent = readmeContent.replace(
            /버전: [0-9]+\.[0-9]+\.[0-9]+/g,
            `버전: ${newVersion}`
        );

        fs.writeFileSync(readmePath, readmeContent);
        console.log('README.md 파일에서 버전 정보가 업데이트되었습니다.');
    }
} catch (error) {
    console.warn('다른 파일에서 버전 업데이트 중 오류가 발생했습니다:', error.message);
}

console.log('\n버전 업데이트가 완료되었습니다!');
console.log('릴리스를 만들려면 다음 명령을 실행하세요:');
console.log(`  git commit -am "버전 ${newVersion}로 업데이트"`);
console.log(`  git tag -a v${newVersion} -m "버전 ${newVersion}"`);
console.log('  git push && git push --tags');
console.log('또는 release.js 스크립트를 실행하세요:');
console.log('  node scripts/release.js');