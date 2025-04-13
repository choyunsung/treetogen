#!/usr/bin/env node
// build-all.js - 크로스 플랫폼 빌드 스크립트

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 현재 플랫폼 및 작업 디렉토리 확인
const platform = os.platform();
const isWindows = platform === 'win32';
const rootDir = path.resolve(__dirname, '..');
console.log(`현재 플랫폼: ${platform}`);
console.log(`작업 디렉토리: ${rootDir}`);

// mkdir 명령어 (플랫폼에 맞게 설정)
const mkdirCommand = isWindows
    ? 'if not exist "dist\\windows" mkdir dist\\windows && if not exist "dist\\macos" mkdir dist\\macos && if not exist "dist\\linux" mkdir dist\\linux'
    : 'mkdir -p dist/{windows,macos,linux}';

// 빌드 디렉토리 확인 및 생성
try {
    console.log('빌드 디렉토리를 생성합니다...');
    execSync(mkdirCommand, { stdio: 'inherit', cwd: rootDir });
} catch (error) {
    console.error('디렉토리 생성 중 오류:', error.message);

    // 실패 시 수동으로 디렉토리 생성
    const distDir = path.join(rootDir, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    ['windows', 'macos', 'linux'].forEach(dir => {
        const platformDir = path.join(distDir, dir);
        if (!fs.existsSync(platformDir)) {
            fs.mkdirSync(platformDir, { recursive: true });
        }
    });

    console.log('빌드 디렉토리 수동 생성 완료');
}

// pkg 설치 확인
try {
    execSync('pkg --version', { stdio: 'ignore' });
    console.log('pkg가 설치되어 있습니다.');
} catch (error) {
    console.log('pkg를 설치합니다...');
    execSync('npm install -g pkg', { stdio: 'inherit' });
}

// 빌드 함수
function buildForPlatform(targetPlatform, outputPath) {
    const fullOutputPath = path.join(rootDir, outputPath);
    const buildCommand = `pkg . --target=node16-${targetPlatform} --output=${fullOutputPath}`;

    console.log(`${targetPlatform}용 빌드 명령어: ${buildCommand}`);

    try {
        execSync(buildCommand, { stdio: 'inherit', cwd: rootDir });
        console.log(`${targetPlatform} 빌드 완료!`);
        return true;
    } catch (error) {
        console.error(`${targetPlatform} 빌드 중 오류:`, error.message);
        return false;
    }
}

// 모든 플랫폼 빌드 실행
console.log('\n===== 모든 플랫폼용 빌드 시작 =====');

// Windows 빌드
const winSuccess = buildForPlatform('win-x64', 'dist/windows/treetogen.exe');

// macOS 빌드
const macSuccess = buildForPlatform('macos-x64', 'dist/macos/treetogen');

// Linux 빌드
const linuxSuccess = buildForPlatform('linux-x64', 'dist/linux/treetogen');

// 실행 권한 부여 (macOS/Linux)
if (!isWindows) {
    console.log('\n실행 권한을 부여합니다...');

    if (macSuccess) {
        try {
            const macExecutable = path.join(rootDir, 'dist/macos/treetogen');
            execSync(`chmod +x "${macExecutable}"`, { stdio: 'inherit' });
            console.log('macOS 실행 파일 권한 설정 완료');
        } catch (error) {
            console.error('macOS 실행 권한 부여 중 오류:', error.message);
        }
    }

    if (linuxSuccess) {
        try {
            const linuxExecutable = path.join(rootDir, 'dist/linux/treetogen');
            execSync(`chmod +x "${linuxExecutable}"`, { stdio: 'inherit' });
            console.log('Linux 실행 파일 권한 설정 완료');
        } catch (error) {
            console.error('Linux 실행 권한 부여 중 오류:', error.message);
        }
    }
}

// 빌드 결과 요약
console.log('\n===== 빌드 결과 요약 =====');
console.log(`Windows: ${winSuccess ? '성공' : '실패'}`);
console.log(`macOS: ${macSuccess ? '성공' : '실패'}`);
console.log(`Linux: ${linuxSuccess ? '성공' : '실패'}`);

if (winSuccess && macSuccess && linuxSuccess) {
    console.log('\n모든 플랫폼 빌드가 성공적으로 완료되었습니다!');
} else {
    console.log('\n일부 플랫폼 빌드가 실패했습니다. 위의 오류 메시지를 확인하세요.');
    process.exit(1);
}