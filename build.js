#!/usr/bin/env node
// build.js - 독립 실행 파일 빌드 스크립트 (경로 수정)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 현재 플랫폼 확인
const platform = os.platform();
console.log(`현재 플랫폼: ${platform}`);

// 빌드 디렉토리 확인 및 생성
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('dist 디렉토리 생성됨');
}

// 플랫폼별 디렉토리 생성
const platformDirs = ['windows', 'macos', 'linux'];
platformDirs.forEach(dir => {
    const platformDir = path.join(distDir, dir);
    if (!fs.existsSync(platformDir)) {
        fs.mkdirSync(platformDir, { recursive: true });
        console.log(`${dir} 디렉토리 생성됨`);
    }
});

// pkg 설치 확인
try {
    execSync('pkg --version', { stdio: 'ignore' });
    console.log('pkg가 이미 설치되어 있습니다.');
} catch (error) {
    console.log('pkg를 설치합니다...');
    execSync('npm install -g pkg', { stdio: 'inherit' });
}

// 빌드 실행
console.log('실행 파일 빌드 시작...');

try {
    // 현재 플랫폼에 맞는 빌드
    if (platform === 'win32') {
        console.log('Windows용 실행 파일을 빌드합니다...');
        execSync('pkg . --target node16-win-x64 --output dist/windows/treetogen.exe', { stdio: 'inherit' });
    } else if (platform === 'darwin') {
        console.log('macOS용 실행 파일을 빌드합니다...');
        execSync('pkg . --target node16-macos-x64 --output dist/macos/treetogen', { stdio: 'inherit' });
    } else if (platform === 'linux') {
        console.log('Linux용 실행 파일을 빌드합니다...');
        execSync('pkg . --target node16-linux-x64 --output dist/linux/treetogen', { stdio: 'inherit' });
    }

    console.log('빌드 완료!');

    // 모든 플랫폼용 빌드 (선택적)
    const buildAll = process.argv.includes('--all');
    if (buildAll) {
        console.log('\n모든 플랫폼용 실행 파일을 빌드합니다...');
        execSync('npm run build:all', { stdio: 'inherit' });
        console.log('모든 플랫폼 빌드 완료!');
    }
} catch (error) {
    console.error('빌드 중 오류 발생:', error.message);
    process.exit(1);
}

// 실행 권한 부여 (macOS/Linux)
if (platform !== 'win32') {
    try {
        if (platform === 'darwin') {
            console.log('macOS 실행 파일에 실행 권한을 부여합니다...');
            execSync('chmod +x dist/macos/treetogen', { stdio: 'inherit' });
        } else {
            console.log('Linux 실행 파일에 실행 권한을 부여합니다...');
            execSync('chmod +x dist/linux/treetogen', { stdio: 'inherit' });
        }
        console.log('실행 권한 부여 완료');
    } catch (error) {
        console.error('실행 권한 부여 중 오류 발생:', error.message);
    }
}

console.log('\n빌드 과정이 성공적으로 완료되었습니다!');
let execPath = '';
if (platform === 'win32') {
    execPath = 'dist\\windows\\treetogen.exe';
} else if (platform === 'darwin') {
    execPath = './dist/macos/treetogen';
} else {
    execPath = './dist/linux/treetogen';
}
console.log(`실행 파일 사용 방법: ${execPath} interactive`);