#!/usr/bin/env node
// scripts/release.js - 크로스 플랫폼 릴리스 스크립트

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os'); // OS 정보를 위해 추가

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 운영체제 확인
const isWindows = os.platform() === 'win32';

// 플랫폼에 맞는 명령어 실행 함수
function execCommand(command, options = {}) {
    // 윈도우에서는 일부 명령어 변환이 필요합니다
    let cmd = command;
    if (isWindows) {
        // mkdir -p 대체
        cmd = cmd.replace(/mkdir -p ([^ ]+)/g, 'mkdir -p "$1"')
            .replace(/mkdir -p/g, 'if not exist "$1" mkdir');

        // cp 명령어 대체
        cmd = cmd.replace(/cp ([^ ]+) ([^ ]+)/g, 'copy /Y "$1" "$2"');

        // chmod 무시 (윈도우에서는 필요 없음)
        if (cmd.startsWith('chmod')) {
            return;
        }

        // zip 명령어는 PowerShell 명령으로 대체
        if (cmd.includes('zip -r')) {
            const match = cmd.match(/cd ([^ ]+) && zip -r ([^ ]+)\.zip ([^ ]+)/);
            if (match) {
                const dir = match[1];
                const zipName = match[2];
                const targetDir = match[3];
                cmd = `powershell -command "Compress-Archive -Path ${dir}\\${targetDir}\\* -DestinationPath ${dir}\\${zipName}.zip -Force"`;
            }
        }
    }

    try {
        console.log(`실행 명령어: ${cmd}`);
        execSync(cmd, options);
    } catch (error) {
        console.error(`명령어 실행 오류: ${cmd}`);
        console.error(error.message);
        throw error;
    }
}

// 디렉토리 생성 함수 (플랫폼 독립적)
function makeDirectory(dir) {
    const fullPath = path.join(__dirname, '..', dir);

    if (!fs.existsSync(fullPath)) {
        if (isWindows) {
            execCommand(`mkdir "${fullPath}"`, { stdio: 'inherit' });
        } else {
            execCommand(`mkdir -p "${fullPath}"`, { stdio: 'inherit' });
        }
    }
}

// 파일 복사 함수 (플랫폼 독립적)
function copyFile(src, dest) {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(__dirname, '..', dest);

    try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`파일 복사 완료: ${src} -> ${dest}`);
    } catch (error) {
        console.error(`파일 복사 오류: ${src} -> ${dest}`);
        console.error(error.message);
    }
}

// 패키지 압축 함수 (플랫폼 독립적)
function createZipPackage(dir, zipName) {
    const fullDir = path.join(__dirname, '..', dir);
    const fullZipPath = path.join(__dirname, '..', 'release', `${zipName}.zip`);

    if (isWindows) {
        execCommand(
            `powershell -command "Compress-Archive -Path '${fullDir}/*' -DestinationPath '${fullZipPath}' -Force"`,
            { stdio: 'inherit' }
        );
    } else {
        execCommand(
            `cd ${path.join(__dirname, '..')} && zip -r release/${zipName}.zip ${dir}/`,
            { stdio: 'inherit' }
        );
    }
}

// 사용자에게 질문하는 함수
function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    console.log('=== TreeToGen 릴리스 도구 ===\n');
    console.log(`실행 환경: ${isWindows ? '윈도우' : '유닉스/맥'}\n`);

    // 버전 확인
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const currentVersion = packageJson.version;

    console.log(`현재 package.json의 버전: ${currentVersion}`);

    const version = await askQuestion('릴리스할 버전을 입력하세요 (기본값: 현재 버전): ');
    const releaseVersion = version || currentVersion;
    const tagName = `v${releaseVersion}`;

    // package.json 버전 업데이트
    if (version && version !== currentVersion) {
        packageJson.version = version;
        fs.writeFileSync(
            path.join(__dirname, '..', 'package.json'),
            JSON.stringify(packageJson, null, 2) + '\n'
        );
        console.log(`package.json 버전이 ${version}으로 업데이트되었습니다.`);
    }

    // 빌드 확인
    const shouldBuild = await askQuestion('실행 파일을 다시 빌드하시겠습니까? (y/n): ');

    if (shouldBuild.toLowerCase() === 'y') {
        console.log('\n모든 플랫폼용 실행 파일을 빌드합니다...');
        try {
            execCommand('npm run build:all', { stdio: 'inherit' });
            console.log('빌드가 완료되었습니다.');
        } catch (error) {
            console.error('빌드 중 오류가 발생했습니다:', error.message);
            rl.close();
            return;
        }
    }

    // 릴리스 패키지 생성
    console.log('\n배포 패키지를 준비합니다...');

    try {
        // 릴리스 디렉토리 생성
        makeDirectory('release');
        makeDirectory('release/windows');
        makeDirectory('release/macos');
        makeDirectory('release/linux');

        // Windows 패키지
        copyFile('dist/windows/treetogen.exe', 'release/windows/treetogen.exe');
        copyFile('README.md', 'release/windows/README.md');

        try {
            copyFile('LICENSE', 'release/windows/LICENSE');
        } catch (error) {
            console.log('LICENSE 파일이 없습니다. 패키지 생성은 계속됩니다.');
        }

        // macOS 패키지
        copyFile('dist/macos/treetogen', 'release/macos/treetogen');
        copyFile('README.md', 'release/macos/README.md');

        try {
            copyFile('LICENSE', 'release/macos/LICENSE');
        } catch (error) {
            console.log('LICENSE 파일이 없습니다. 패키지 생성은 계속됩니다.');
        }

        // macOS에서는 실행 권한 부여
        if (!isWindows) {
            execCommand('chmod +x release/macos/treetogen', { stdio: 'inherit' });
        }

        // Linux 패키지
        copyFile('dist/linux/treetogen', 'release/linux/treetogen');
        copyFile('README.md', 'release/linux/README.md');

        try {
            copyFile('LICENSE', 'release/linux/LICENSE');
        } catch (error) {
            console.log('LICENSE 파일이 없습니다. 패키지 생성은 계속됩니다.');
        }

        // Linux에서는 실행 권한 부여
        if (!isWindows) {
            execCommand('chmod +x release/linux/treetogen', { stdio: 'inherit' });
        }

        // ZIP 파일 생성
        console.log('\nZIP 패키지를 생성합니다...');
        createZipPackage('release/windows', 'treetogen-windows');
        createZipPackage('release/macos', 'treetogen-macos');
        createZipPackage('release/linux', 'treetogen-linux');

        console.log('배포 패키지가 생성되었습니다.');
    } catch (error) {
        console.error('패키지 생성 중 오류가 발생했습니다:', error.message);
        rl.close();
        return;
    }

    // 릴리스 노트 작성
    console.log('\n릴리스 노트를 작성합니다...');

    const defaultNotes = `# TreeToGen ${tagName}\n\n주요 변경 사항:\n- 새 버전 릴리스\n`;

    let releaseNotes = '';
    const hasReleaseNotes = await askQuestion('릴리스 노트 파일이 있습니까? (y/n): ');

    if (hasReleaseNotes.toLowerCase() === 'y') {
        const notesPath = await askQuestion('릴리스 노트 파일 경로를 입력하세요: ');
        try {
            releaseNotes = fs.readFileSync(notesPath, 'utf8');
            console.log('릴리스 노트를 읽었습니다.');
        } catch (error) {
            console.error('파일을 읽을 수 없습니다:', error.message);
            releaseNotes = defaultNotes;
        }
    } else {
        // 간단한 에디터 제공
        console.log('릴리스 노트를 직접 입력하세요. 입력을 마치려면 빈 줄에서 ENTER를 누르세요:');
        console.log('기본값:');
        console.log(defaultNotes);

        let line = '';
        releaseNotes = defaultNotes;

        const editNotes = await askQuestion('기본 릴리스 노트를 수정하시겠습니까? (y/n): ');

        if (editNotes.toLowerCase() === 'y') {
            releaseNotes = '';
            let lineNumber = 1;

            do {
                line = await askQuestion(`${lineNumber}: `);
                if (line) {
                    releaseNotes += line + '\n';
                    lineNumber++;
                }
            } while (line);
        }
    }

    // 임시 릴리스 노트 파일 저장
    const tempNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');
    fs.writeFileSync(tempNotesPath, releaseNotes);

    // GitHub 릴리스 생성
    console.log('\nGitHub 릴리스를 생성합니다...');

    const useGitHub = await askQuestion('GitHub 릴리스를 생성하시겠습니까? (y/n): ');

    if (useGitHub.toLowerCase() === 'y') {
        // GitHub CLI 확인
        let hasGhCli = false;
        try {
            execCommand('gh --version', { stdio: 'ignore' });
            hasGhCli = true;
        } catch (error) {
            console.log('GitHub CLI가 설치되어 있지 않습니다. 수동으로 릴리스를 생성해야 합니다.');
        }

        if (hasGhCli) {
            // GitHub 로그인 확인
            try {
                execCommand('gh auth status', { stdio: 'ignore' });

                // 커밋 및 태그 생성
                const createTag = await askQuestion('Git 태그를 생성하고 푸시하시겠습니까? (y/n): ');

                if (createTag.toLowerCase() === 'y') {
                    try {
                        // 변경 사항 커밋
                        const hasChanges = !!execSync('git status --porcelain').toString().trim();

                        if (hasChanges) {
                            const commitMsg = await askQuestion('커밋 메시지를 입력하세요: ');
                            execCommand(`git add .`, { stdio: 'inherit' });
                            execCommand(`git commit -m "${commitMsg || `Release ${tagName}`}"`, { stdio: 'inherit' });
                        }

                        // 태그 생성 및 푸시
                        execCommand(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
                        execCommand(`git push origin ${tagName}`, { stdio: 'inherit' });

                        console.log(`태그 ${tagName}가 생성되고 푸시되었습니다.`);
                    } catch (error) {
                        console.error('Git 작업 중 오류가 발생했습니다:', error.message);
                    }
                }

                // GitHub 릴리스 생성
                try {
                    console.log('GitHub 릴리스를 생성합니다... (이 작업은 몇 분 정도 걸릴 수 있습니다)');

                    const releaseCmd = isWindows
                        ? `gh release create ${tagName} --title "TreeToGen ${tagName}" --notes-file "${tempNotesPath}" "${path.join(__dirname, '..', 'release', 'treetogen-windows.zip')}" "${path.join(__dirname, '..', 'release', 'treetogen-macos.zip')}" "${path.join(__dirname, '..', 'release', 'treetogen-linux.zip')}"`
                        : `gh release create ${tagName} --title "TreeToGen ${tagName}" --notes-file "${tempNotesPath}" release/treetogen-windows.zip release/treetogen-macos.zip release/treetogen-linux.zip`;

                    execCommand(releaseCmd, { stdio: 'inherit' });

                    console.log(`GitHub 릴리스 ${tagName}가 성공적으로 생성되었습니다!`);
                } catch (error) {
                    console.error('GitHub 릴리스 생성 중 오류가 발생했습니다:', error.message);
                }
            } catch (error) {
                console.log('GitHub에 로그인되어 있지 않습니다. \'gh auth login\' 명령으로 로그인하세요.');
            }
        }
    }

    // 임시 파일 정리
    try {
        fs.unlinkSync(tempNotesPath);
    } catch (error) {
        // 무시
    }

    console.log('\n릴리스 과정이 완료되었습니다!');
    console.log(`배포 파일 위치: ${path.join(__dirname, '..', 'release')}`);

    rl.close();
}

main().catch(error => {
    console.error('오류가 발생했습니다:', error);
    rl.close();
});