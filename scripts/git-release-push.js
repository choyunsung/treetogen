#!/usr/bin/env node
// scripts/git-release-push.js - 릴리스 파일만 푸시하는 스크립트

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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
    console.log('=== 릴리스 파일만 GitHub에 푸시 ===\n');

    try {
        // release 디렉토리 확인
        const releaseDir = path.join(process.cwd(), 'release');
        if (!fs.existsSync(releaseDir)) {
            console.log('release 디렉토리가 존재하지 않습니다.');
            console.log('먼저 릴리스 파일을 빌드하세요: npm run build:all');
            rl.close();
            return;
        }

        // 릴리스 파일 확인
        const releaseFiles = ['treetogen-windows.zip', 'treetogen-macos.zip', 'treetogen-linux.zip']
            .map(file => path.join(releaseDir, file))
            .filter(file => fs.existsSync(file));

        if (releaseFiles.length === 0) {
            console.log('릴리스 ZIP 파일을 찾을 수 없습니다.');
            console.log('먼저 릴리스 파일을 생성하세요: npm run release');
            rl.close();
            return;
        }

        console.log('다음 릴리스 파일을 찾았습니다:');
        releaseFiles.forEach(file => {
            console.log(`- ${path.basename(file)}`);
        });

        // 버전 확인
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        const currentVersion = packageJson.version;

        console.log(`\n현재 package.json의 버전: ${currentVersion}`);

        const version = await askQuestion('사용할 버전을 입력하세요 (기본값: 현재 버전): ');
        const releaseVersion = version || currentVersion;
        const tagName = `v${releaseVersion}`;

        // 태그 확인
        let tagExists = false;
        try {
            execSync(`git tag -l ${tagName}`, { stdio: 'pipe' }).toString().trim();
            tagExists = true;
        } catch (error) {
            // 태그가 없습니다
        }

        if (!tagExists) {
            // 태그 생성
            const createTag = await askQuestion(`태그 '${tagName}'가 존재하지 않습니다. 생성하시겠습니까? (y/n): `);

            if (createTag.toLowerCase() === 'y') {
                const tagMessage = await askQuestion('태그 메시지를 입력하세요: ');

                try {
                    execSync(`git tag -a ${tagName} -m "${tagMessage || `Version ${tagName}`}"`, { stdio: 'inherit' });
                    console.log(`\n태그 '${tagName}'가 생성되었습니다.`);
                } catch (error) {
                    console.error('태그 생성 중 오류가 발생했습니다:', error.message);
                    rl.close();
                    return;
                }
            }
        } else {
            console.log(`태그 '${tagName}'가 이미 존재합니다.`);
        }

        // GitHub CLI 확인
        let hasGhCli = false;
        try {
            execSync('gh --version', { stdio: 'ignore' });
            hasGhCli = true;
        } catch (error) {
            console.log('GitHub CLI가 설치되어 있지 않습니다. 릴리스를 수동으로 생성해야 합니다.');
        }

        if (hasGhCli) {
            // GitHub 로그인 확인
            try {
                execSync('gh auth status', { stdio: 'ignore' });

                // 기존 릴리스 확인
                let releaseExists = false;
                try {
                    const releaseCheck = execSync(`gh release view ${tagName} --json name`, { stdio: 'pipe' }).toString().trim();
                    if (releaseCheck) {
                        releaseExists = true;
                    }
                } catch (error) {
                    // 릴리스가 존재하지 않습니다
                }

                if (releaseExists) {
                    // 릴리스 업데이트
                    const updateRelease = await askQuestion(`릴리스 '${tagName}'가 이미 존재합니다. 업데이트하시겠습니까? (y/n): `);

                    if (updateRelease.toLowerCase() === 'y') {
                        console.log(`\n릴리스 '${tagName}'에 파일을 업로드합니다...`);

                        for (const file of releaseFiles) {
                            try {
                                execSync(`gh release upload ${tagName} "${file}" --clobber`, { stdio: 'inherit' });
                                console.log(`파일 '${path.basename(file)}'이 업로드되었습니다.`);
                            } catch (error) {
                                console.error(`파일 '${path.basename(file)}' 업로드 중 오류가 발생했습니다:`, error.message);
                            }
                        }
                    }
                } else {
                    // 새 릴리스 생성
                    const createRelease = await askQuestion('새 GitHub 릴리스를 생성하시겠습니까? (y/n): ');

                    if (createRelease.toLowerCase() === 'y') {
                        // 릴리스 노트 작성
                        console.log('\n릴리스 노트를 작성합니다...');

                        const defaultNotes = `# TreeToGen ${tagName}\n\n주요 변경 사항:\n- 새 버전 릴리스\n`;
                        let releaseNotes = '';

                        const editNotes = await askQuestion('릴리스 노트를 작성하시겠습니까? (y/n): ');

                        if (editNotes.toLowerCase() === 'y') {
                            console.log('릴리스 노트를 입력하세요. 입력을 마치려면 빈 줄에서 ENTER를 누르세요:');

                            let line = '';
                            let lineNumber = 1;

                            do {
                                line = await askQuestion(`${lineNumber}: `);
                                if (line) {
                                    releaseNotes += line + '\n';
                                    lineNumber++;
                                }
                            } while (line);
                        } else {
                            releaseNotes = defaultNotes;
                        }

                        // 임시 릴리스 노트 파일 저장
                        const tempNotesPath = path.join(process.cwd(), 'RELEASE_NOTES.md');
                        fs.writeFileSync(tempNotesPath, releaseNotes);

                        // GitHub 릴리스 생성
                        try {
                            console.log('\nGitHub 릴리스를 생성합니다...');

                            const createCmd = `gh release create ${tagName} --title "TreeToGen ${tagName}" --notes-file "${tempNotesPath}"`;
                            execSync(createCmd, { stdio: 'inherit' });

                            console.log(`GitHub 릴리스 '${tagName}'가 생성되었습니다.`);

                            // 파일 업로드
                            console.log('\n릴리스 파일을 업로드합니다...');

                            for (const file of releaseFiles) {
                                try {
                                    execSync(`gh release upload ${tagName} "${file}"`, { stdio: 'inherit' });
                                    console.log(`파일 '${path.basename(file)}'이 업로드되었습니다.`);
                                } catch (error) {
                                    console.error(`파일 '${path.basename(file)}' 업로드 중 오류가 발생했습니다:`, error.message);
                                }
                            }

                            // 임시 파일 정리
                            fs.unlinkSync(tempNotesPath);
                        } catch (error) {
                            console.error('GitHub 릴리스 생성 중 오류가 발생했습니다:', error.message);

                            // 임시 파일 정리
                            if (fs.existsSync(tempNotesPath)) {
                                fs.unlinkSync(tempNotesPath);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('GitHub에 로그인되어 있지 않습니다. \'gh auth login\' 명령으로 로그인하세요.');
            }
        } else {
            // GitHub CLI 없이 태그 푸시
            const pushTag = await askQuestion('태그를 GitHub에 푸시하시겠습니까? (y/n): ');

            if (pushTag.toLowerCase() === 'y') {
                try {
                    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
                    console.log(`\n태그 '${tagName}'이 GitHub에 푸시되었습니다.`);
                    console.log('GitHub 웹사이트에서 직접 릴리스를 생성하고 파일을 업로드하세요.');
                } catch (error) {
                    console.error('태그 푸시 중 오류가 발생했습니다:', error.message);
                }
            }
        }

    } catch (error) {
        console.error('오류가 발생했습니다:', error.message);
    }

    console.log('\n작업이 완료되었습니다!');
    rl.close();
}

// 스크립트 실행
main().catch(error => {
    console.error('예기치 않은 오류가 발생했습니다:', error);
    rl.close();
});