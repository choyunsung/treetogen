// interactive-cli.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { generateDirectoryStructure } = require('./tree-generator');

// 대화형 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 사용자에게 질문하고 응답을 기다립니다.
 * @param {string} question - 사용자에게 물을 질문
 * @returns {Promise<string>} - 사용자 응답
 */
function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

/**
 * 트리 텍스트를 파일에 저장합니다.
 * @param {string} treeText - 저장할 트리 텍스트
 * @param {string} filePath - 저장할 파일 경로
 */
function saveTreeToFile(treeText, filePath) {
    try {
        fs.writeFileSync(filePath, treeText, 'utf8');
        console.log(`트리 구조가 ${filePath}에 저장되었습니다.`);
    } catch (err) {
        console.error(`파일을 저장할 수 없습니다: ${err.message}`);
    }
}

/**
 * 대화형 CLI를 시작합니다.
 */
async function startInteractiveCLI() {
    console.log('=== 디렉토리 트리 생성기 ===');
    console.log('트리 구조를 입력하고 생성할 수 있습니다.');

    // 입력 방식 선택
    const inputMethod = await askQuestion(
        '트리 입력 방식을 선택하세요:\n' +
        '1. 직접 입력\n' +
        '2. 파일에서 읽기\n' +
        '선택 (1 또는 2): '
    );

    let treeText = '';

    if (inputMethod === '1') {
        // 직접 입력 방식
        console.log('\n트리 구조를 입력하세요. 입력을 마치려면 빈 줄에서 ENTER를 누르세요:');
        console.log('예시 형식:');
        console.log('backend/');
        console.log('├── Dockerfile');
        console.log('├── docker-compose.yml');
        console.log('└── server.js');

        let line = '';
        let lineNumber = 1;

        do {
            line = await askQuestion(`${lineNumber}: `);
            if (line) {
                treeText += line + '\n';
                lineNumber++;
            }
        } while (line);

    } else if (inputMethod === '2') {
        // 파일에서 읽기 방식
        const filePath = await askQuestion('트리 구조가 저장된 파일 경로를 입력하세요: ');

        try {
            treeText = fs.readFileSync(filePath, 'utf8');
            console.log('파일에서 트리 구조를 읽었습니다.');
        } catch (err) {
            console.error(`파일을 읽을 수 없습니다: ${err.message}`);
            rl.close();
            return;
        }
    } else {
        console.log('잘못된 선택입니다.');
        rl.close();
        return;
    }

    // 트리 구조 확인
    console.log('\n입력된 트리 구조:');
    console.log(treeText);

    const confirmTree = await askQuestion('이 트리 구조로 계속 진행하시겠습니까? (y/n): ');

    if (confirmTree.toLowerCase() !== 'y') {
        console.log('작업이 취소되었습니다.');
        rl.close();
        return;
    }

    // 트리 저장 여부 확인
    const saveTree = await askQuestion('이 트리 구조를 파일로 저장하시겠습니까? (y/n): ');

    if (saveTree.toLowerCase() === 'y') {
        const saveFilePath = await askQuestion('저장할 파일 경로를 입력하세요: ');
        saveTreeToFile(treeText, saveFilePath);
    }

    // 대상 디렉토리 선택
    const targetDir = await askQuestion('트리 구조를 생성할 대상 디렉토리를 입력하세요 (기본값: 현재 디렉토리): ');
    const finalTargetDir = targetDir || process.cwd();

    // 디렉토리 구조 생성
    console.log(`\n${finalTargetDir} 경로에 디렉토리 구조를 생성합니다...`);
    generateDirectoryStructure(treeText, finalTargetDir);

    console.log('작업이 완료되었습니다!');
    rl.close();
}

// 스크립트가 직접 실행된 경우 CLI 시작
if (require.main === module) {
    startInteractiveCLI();
}

module.exports = {
    startInteractiveCLI
};