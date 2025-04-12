// tree-generator.js
const fs = require('fs');
const path = require('path');

/**
 * 텍스트 형식의 디렉토리 트리를 파싱하여 실제 파일 시스템에 생성합니다.
 * @param {string} treeText - 트리 구조 텍스트
 * @param {string} rootDir - 생성할 루트 디렉토리 경로
 */
function generateDirectoryStructure(treeText, rootDir) {
    // 트리 텍스트의 줄을 배열로 나눕니다
    const lines = treeText.trim().split('\n');

    // 처리할 줄이 없으면 종료
    if (lines.length === 0) {
        console.log('유효한 트리 구조가 아닙니다.');
        return;
    }

    // 루트 디렉토리 이름 추출 (첫 번째 줄)
    const rootName = lines[0].replace(/[├└─│ ]/g, '').trim();

    // 루트 디렉토리 경로 설정
    const basePath = path.join(rootDir, rootName);

    // 루트 디렉토리 생성
    createDirectoryIfNotExists(basePath);
    console.log(`루트 디렉토리 생성: ${basePath}`);

    // 현재 경로와 들여쓰기 수준을 추적하는 스택
    const pathStack = [{ path: basePath, level: 0 }];

    // 첫 번째 줄을 제외한 나머지 줄을 처리
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // 빈 줄 건너뛰기
        if (!line.trim()) continue;

        // 들여쓰기 수준 계산 (│, ├, └, ─ 등의 문자를 공백으로 치환한 후 원래 길이와의 차이로 계산)
        const indentLevel = line.search(/[^│├└─ ]/);
        if (indentLevel === -1) continue;

        // 파일 또는 디렉토리 이름 추출
        const name = line.replace(/[├└─│ ]/g, '').trim();

        // 들여쓰기 수준에 따라 현재 경로 결정
        while (pathStack.length > 0 && pathStack[pathStack.length - 1].level >= indentLevel) {
            pathStack.pop();
        }

        // 현재 경로가 없으면 루트로 설정
        if (pathStack.length === 0) {
            pathStack.push({ path: basePath, level: 0 });
        }

        const currentPath = pathStack[pathStack.length - 1].path;
        const newPath = path.join(currentPath, name);

        // 파일 또는 디렉토리 생성
        if (name.includes('.')) {
            // 파일인 경우
            createFileIfNotExists(newPath);
            console.log(`파일 생성: ${newPath}`);
        } else {
            // 디렉토리인 경우
            createDirectoryIfNotExists(newPath);
            console.log(`디렉토리 생성: ${newPath}`);
            pathStack.push({ path: newPath, level: indentLevel });
        }
    }

    console.log('\n디렉토리 구조 생성이 완료되었습니다!');
}

/**
 * 디렉토리가 존재하지 않으면 생성합니다.
 * @param {string} dirPath - 생성할 디렉토리 경로
 */
function createDirectoryIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * 파일이 존재하지 않으면 빈 파일을 생성합니다.
 * @param {string} filePath - 생성할 파일 경로
 */
function createFileIfNotExists(filePath) {
    const dirPath = path.dirname(filePath);
    createDirectoryIfNotExists(dirPath);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }
}

// 명령행 인수에서 트리 텍스트 파일과 대상 디렉토리를 읽습니다
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('사용법: node tree-generator.js <트리_텍스트_파일> <대상_디렉토리>');
        console.log('또는: node tree-generator.js --text "<트리_텍스트>" <대상_디렉토리>');
        process.exit(1);
    }

    let treeText;
    let targetDir;

    if (args[0] === '--text') {
        // 트리 텍스트를 직접 지정한 경우
        treeText = args[1];
        targetDir = args[2] || process.cwd();
    } else {
        // 트리 텍스트 파일을 지정한 경우
        const treeFilePath = args[0];
        targetDir = args[1] || process.cwd();

        try {
            treeText = fs.readFileSync(treeFilePath, 'utf8');
        } catch (err) {
            console.error(`트리 텍스트 파일을 읽을 수 없습니다: ${err.message}`);
            process.exit(1);
        }
    }

    generateDirectoryStructure(treeText, targetDir);
}

module.exports = {
    generateDirectoryStructure
};