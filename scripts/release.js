#!/usr/bin/env node
// scripts/release.js - 수동 릴리스 스크립트 (경로 수정)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
            execSync('npm run build:all', { stdio: 'inherit' });
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
        execSync('mkdir -p release/{windows,macos,linux}', { stdio: 'inherit' });

        // Windows 패키지
        execSync('cp dist/windows/treetogen.exe release/windows/', { stdio: 'inherit' });
        execSync('cp README.md LICENSE release/windows/ || true', { stdio: 'inherit' });

        // macOS 패키지
        execSync('cp dist/macos/treetogen release/macos/', { stdio: 'inherit' });
        execSync('chmod +x release/macos/treetogen', { stdio: 'inherit' });
        execSync('cp README.md LICENSE release/macos/ || true', { stdio: 'inherit' });

        // Linux 패키지
        execSync('cp dist/linux/treetogen release/linux/', { stdio: 'inherit' });
        execSync('chmod +x release/linux/treetogen', { stdio: 'inherit' });
        execSync('cp README.md LICENSE release/linux/ || true', { stdio: 'inherit' });

        // ZIP 파일 생성
        execSync('cd release && zip -r treetogen-windows.zip windows/ && zip -r treetogen-macos.zip macos/ && zip -r treetogen-linux.zip linux/ && cd ..', { stdio: 'inherit' });

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
            execSync('gh --version', { stdio: 'ignore' });
            hasGhCli = true;
        } catch (error) {
            console.log('GitHub CLI가 설치되어 있지 않습니다. 수동으로 릴리스를 생성해야 합니다.');
        }

        if (hasGhCli) {
            // GitHub 로그인 확인
            try {
                execSync('gh auth status', { stdio: 'ignore' });

                // 커밋 및 태그 생성
                const createTag = await askQuestion('Git 태그를 생성하고 푸시하시겠습니까? (y/n): ');

                if (createTag.toLowerCase() === 'y') {
                    try {
                        // 변경 사항 커밋
                        const hasChanges = !!execSync('git status --porcelain').toString().trim();

                        if (hasChanges) {
                            const commitMsg = await askQuestion('커밋 메시지를 입력하세요: ');
                            execSync(`git add .`, { stdio: 'inherit' });
                            execSync(`git commit -m "${commitMsg || `Release ${tagName}`}"`, { stdio: 'inherit' });
                        }

                        // 태그 생성 및 푸시
                        execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
                        execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

                        console.log(`태그 ${tagName}가 생성되고 푸시되었습니다.`);
                    } catch (error) {
                        console.error('Git 작업 중 오류가 발생했습니다:', error.message);
                    }
                }

                // GitHub 릴리스 생성
                try {
                    console.log('GitHub 릴리스를 생성합니다... (이 작업은 몇 분 정도 걸릴 수 있습니다)');

                    const cmd = `gh release create ${tagName} \
            --title "TreeToGen ${tagName}" \
            --notes-file "${tempNotesPath}" \
            release/treetogen-windows.zip \
            release/treetogen-macos.zip \
            release/treetogen-linux.zip`;

                    execSync(cmd, { stdio: 'inherit' });

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