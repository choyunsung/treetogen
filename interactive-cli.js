// interactive-cli.js
const readline = require('readline');
const { generateDirectoryStructure } = require('./tree-generator');

// 대화형 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 여러 줄의 입력을 받는 함수
 * @param {string} prompt - 사용자에게 보여줄 프롬프트
 * @returns {Promise<string>} - 사용자가 입력한 여러 줄의 텍스트
 */
function getMultilineInput(prompt) {
    return new Promise(resolve => {
        console.log(prompt);
        console.log('입력을 마치려면 빈 줄에서 ENTER를 누르세요:');

        let lines = [];
        let inputListener = (line) => {
            // 빈 줄이 입력되면 입력 종료
            if (line.trim() === '') {
                rl.removeListener('line', inputListener);
                resolve(lines.join('\n'));
                return;
            }

            lines.push(line);
        };

        rl.on('line', inputListener);
    });
}

/**
 * 사용자에게 질문하고 응답을 기다립니다.
 * @param {string} question - 사용자에게 물을 질문
 * @returns {Promise<string>} - 사용자 응답
 */
function askQuestion(question = '') {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer.trim());
        });
    });
}

/**
 * 대화형 CLI를 시작합니다.
 */
async function startInteractiveCLI() {
    console.log('=== 디렉토리 트리 생성기 ===');
    console.log('트리 구조를 입력하고 생성할 수 있습니다.');

    // 여러 줄 입력 받기
    const treeText = await getMultilineInput('\n트리 구조를 입력하세요.');

    // 트리 구조 확인
    console.log('\n\n입력된 트리 구조:');
    console.log(treeText);
    console.log("\n\n");

    const confirmTree = await askQuestion('이 트리 구조로 계속 진행하시겠습니까? (y/n): ');

    if (confirmTree.toLowerCase() !== 'y') {
        console.log('작업이 취소되었습니다.');
        rl.close();
        return;
    }

    // 대상 디렉토리 선택
    const targetDir = await askQuestion('트리 구조를 생성할 대상 디렉토리를 입력하세요 (기본값: 현재 디렉토리): ');
    const finalTargetDir = targetDir || process.cwd();

    // 디렉토리 구조 생성
    console.log(`\n${finalTargetDir} 경로에 디렉토리 구조를 생성합니다...`);
    try {
        generateDirectoryStructure(treeText, finalTargetDir);
        console.log('작업이 완료되었습니다!');
    } catch (error) {
        console.error('오류 발생:', error.message);
    }

    rl.close();
}

// 스크립트가 직접 실행된 경우 CLI 시작
if (require.main === module) {
    startInteractiveCLI().then(r => {
        console.log('대화형 CLI 종료');
    });
}

module.exports = {
    startInteractiveCLI
};