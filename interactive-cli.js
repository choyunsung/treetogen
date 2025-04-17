// interactive-cli.js
const readline = require('readline');
const { generateDirectoryStructure, formatTreeStructure, createFilesAndDirectories} = require('./tree-generator');
// const { createFilesAndDirectories } = require('./utils');

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

// /**
//  * 트리 구조를 시각적으로 표현합니다.
//  * @param {Array} treeStructure - 처리된 트리 구조 배열
//  * @returns {string} - 포맷팅된 트리 구조 문자열
//  */
// function formatTreeStructure(treeStructure) {
//     if (!treeStructure || treeStructure.length === 0) {
//         return '빈 트리 구조';
//     }
//
//     let result = [];
//
//     // 각 노드를 순회하면서 시각적 트리 구조 생성
//     treeStructure.forEach(node => {
//         const depth = node.depth;
//         const isLast = isLastNodeInLevel(node, treeStructure);
//         const prefix = getNodePrefix(depth, isLast);
//         const nodeType = node.isDirectory ? '📁' : '📄';
//         const commentInfo = node.comment ? ` (주석: ${node.comment})` : '';
//
//         // 전체 경로와 정보 포함
//         result.push(`${prefix}${nodeType} ${node.name}${commentInfo}`);
//     });
//
//     return result.join('\n');
// }

/**
 * 노드가 해당 레벨의 마지막 노드인지 확인합니다.
 * @param {Object} node - 현재 노드
 * @param {Array} treeStructure - 전체 트리 구조
 * @returns {boolean} - 마지막 노드 여부
 */
function isLastNodeInLevel(node, treeStructure) {
    const nodeIndex = treeStructure.indexOf(node);

    // 이 노드 이후의 노드 중 같은 깊이를 가진 노드가 있는지 확인
    for (let i = nodeIndex + 1; i < treeStructure.length; i++) {
        if (treeStructure[i].depth === node.depth) {
            return false;
        }
        // 더 낮은 깊이를 만나면 레벨이 바뀐 것이므로 종료
        if (treeStructure[i].depth < node.depth) {
            break;
        }
    }

    return true;
}

/**
 * 노드의 들여쓰기와 분기 기호를 생성합니다.
 * @param {number} depth - 노드 깊이
 * @param {boolean} isLast - 마지막 노드 여부
 * @returns {string} - 프리픽스 문자열
 */
function getNodePrefix(depth, isLast) {
    let prefix = '';

    // 들여쓰기 생성
    for (let i = 0; i < depth; i++) {
        prefix += '    ';
    }

    // 분기 기호 추가
    if (depth > 0) {
        prefix = prefix.slice(0, -4) + (isLast ? '└── ' : '├── ');
    }

    return prefix;
}

/**
 * 대화형 CLI를 시작합니다.
 */
async function startInteractiveCLI() {
    console.log('=== 디렉토리 트리 생성기 ===');
    console.log('트리 구조를 입력하고 생성할 수 있습니다.');

    // 여러 줄 입력 받기
    const treeText = await getMultilineInput('\n트리 구조를 입력하세요.\n');
    // 트리 구조 생성
    const treeStructure = generateDirectoryStructure(treeText);

    if (!treeStructure || treeStructure.length === 0) {
        console.error('트리 구조 생성에 실패했습니다. 올바른 형식인지 확인하세요.');
        rl.close();
        return;
    }

    // 트리 구조를 시각적으로 출력
    console.log('\n생성될 디렉토리 구조:');
    console.log('----------------------------------------');
    console.log(formatTreeStructure(treeStructure));
    console.log('----------------------------------------');

    // 파일 및 디렉토리 정보 출력
    const fileCount = treeStructure.filter(node => !node.isDirectory).length;
    const dirCount = treeStructure.filter(node => node.isDirectory).length;
    console.log(`총 ${dirCount}개의 디렉토리와 ${fileCount}개의 파일이 생성됩니다.`);

    // 계속 진행 여부 확인
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
        createFilesAndDirectories(treeStructure, finalTargetDir);
        console.log('작업이 완료되었습니다!');
    } catch (error) {
        console.error('오류 발생:', error.message);
    }

    rl.close();
}

// 스크립트가 직접 실행된 경우 CLI 시작
if (require.main === module) {
    startInteractiveCLI().then(() => {
        console.log('대화형 CLI 종료');
    });
}

module.exports = {
    startInteractiveCLI
};