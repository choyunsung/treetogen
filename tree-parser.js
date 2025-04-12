// tree-parser.js
const fs = require('fs');
const path = require('path');

/**
 * 일반 텍스트로 된 디렉토리 트리를 구조화된 형태로 변환합니다.
 * @param {string} input - 트리 텍스트 입력
 * @returns {object} 구조화된 디렉토리 트리
 */
function parseTreeText(input) {
    // 줄 단위로 분리
    const lines = input.trim().split('\n').filter(line => line.trim());

    // 결과 객체 초기화
    const result = {};

    // 루트 디렉토리 이름 (첫 줄)
    const rootName = lines[0].trim();
    result.name = rootName;
    result.type = 'directory';
    result.children = [];

    // 현재 경로 스택 (들여쓰기 수준과 노드 객체를 추적)
    const stack = [{ level: 0, node: result }];

    // 각 줄 처리 (첫 줄 제외)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // 들여쓰기 수준 계산
        let level = 0;
        let j = 0;
        while (j < line.length && (line[j] === ' ' || line[j] === '│' || line[j] === '├' || line[j] === '└' || line[j] === '─')) {
            j++;
            if (line[j-1] === '│' || line[j-1] === '├' || line[j-1] === '└') {
                level++;
            }
        }

        // 파일 또는 디렉토리 이름 추출
        const name = line.substring(j).trim();
        const isFile = name.includes('.');

        // 새 노드 생성
        const newNode = {
            name,
            type: isFile ? 'file' : 'directory'
        };

        if (!isFile) {
            newNode.children = [];
        }

        // 스택에서 적절한 부모 노드 찾기
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        // 부모 노드의 자식으로 추가
        const parent = stack[stack.length - 1].node;
        parent.children.push(newNode);

        // 디렉토리인 경우 스택에 추가
        if (!isFile) {
            stack.push({ level, node: newNode });
        }
    }

    return result;
}

/**
 * 구조화된 디렉토리 트리를 파일 시스템에 생성합니다.
 * @param {object} tree - 구조화된 디렉토리 트리
 * @param {string} basePath - 생성할 기본 경로
 */
function createTreeStructure(tree, basePath) {
    const fullPath = path.join(basePath, tree.name);

    if (tree.type === 'directory') {
        // 디렉토리 생성
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`디렉토리 생성: ${fullPath}`);
        }

        // 자식 노드 처리
        if (tree.children) {
            tree.children.forEach(child => {
                createTreeStructure(child, fullPath);
            });
        }
    } else {
        // 파일 생성
        if (!fs.existsSync(fullPath)) {
            // 디렉토리 경로 확인
            const dirPath = path.dirname(fullPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // 빈 파일 생성
            fs.writeFileSync(fullPath, '');
            console.log(`파일 생성: ${fullPath}`);
        }
    }
}

/**
 * 텍스트 트리 구조를 분석하고 파일 시스템에 생성합니다.
 * @param {string} treeText - 트리 텍스트
 * @param {string} targetDir - 대상 디렉토리
 */
function generateFromTreeText(treeText, targetDir) {
    try {
        const parsedTree = parseTreeText(treeText);
        createTreeStructure(parsedTree, targetDir);
        console.log('\n디렉토리 구조 생성이 완료되었습니다!');
    } catch (err) {
        console.error(`오류 발생: ${err.message}`);
    }
}

// 명령행에서 실행될 때
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('사용법: node tree-parser.js <트리_텍스트 또는 파일> [대상_디렉토리]');
        process.exit(1);
    }

    let treeText;
    let targetDir = args[1] || process.cwd();

    // 첫 번째 인자가 파일인지 확인
    if (fs.existsSync(args[0])) {
        try {
            treeText = fs.readFileSync(args[0], 'utf8');
        } catch (err) {
            console.error(`파일을 읽을 수 없습니다: ${err.message}`);
            process.exit(1);
        }
    } else {
        // 직접 텍스트 입력인 경우
        treeText = args[0];
    }

    generateFromTreeText(treeText, targetDir);
}

module.exports = {
    parseTreeText,
    createTreeStructure,
    generateFromTreeText
};