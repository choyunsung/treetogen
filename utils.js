const fs = require('fs');
const path = require('path');


/**
 * 파일 및 디렉토리를 생성합니다.
 * @param {Array} treeStructure - 트리 구조 정보
 * @param {string} rootDir - 루트 디렉토리 경로
 */
function createFilesAndDirectories(treeStructure, rootDir) {
    if (!treeStructure || treeStructure.length === 0) {
        console.log('생성할 트리 구조가 없습니다.');
        return;
    }

    // 기본 디렉토리 확인
    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir, { recursive: true });
        console.log(`기본 디렉토리 생성: ${rootDir}`);
    }

    // 루트 노드 찾기
    const rootNodes = treeStructure.filter(node => node.level === 0);

    // 각 노드 처리
    for (const node of treeStructure) {
        // 전체 경로 계산
        const targetPath = path.join(rootDir, node.path);

        if (node.isDirectory) {
            // 디렉토리 생성
            createDirectoryIfNotExists(targetPath);
            console.log(`디렉토리 생성: ${targetPath}${node.comment ? ' (주석: ' + node.comment + ')' : ''}`);
        } else {
            // 파일 생성
            createFileWithComment(targetPath, node.comment);
            console.log(`파일 생성: ${targetPath}${node.comment ? ' (주석 포함)' : ''}`);
        }
    }

    console.log('모든 파일 및 디렉토리 생성이 완료되었습니다.');
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
 * 파일이 존재하지 않으면 주석이 포함된 파일을 생성합니다.
 * @param {string} filePath - 생성할 파일 경로
 * @param {string} comment - 파일에 포함할 주석
 */
function createFileWithComment(filePath, comment) {
    const dirPath = path.dirname(filePath);
    createDirectoryIfNotExists(dirPath);

    if (!fs.existsSync(filePath)) {
        // 주석이 있으면 파일 타입에 맞는 형식으로 주석을 추가합니다
        const fileContent = comment ? getFormattedComment(filePath, comment) : '';
        fs.writeFileSync(filePath, fileContent);
    }
}

/**
 * 파일 확장자에 따라 적절한 주석 형식을 반환합니다.
 * @param {string} filePath - 파일 경로
 * @param {string} comment - 주석 내용
 * @returns {string} 파일 형식에 맞는 주석
 */
function getFormattedComment(filePath, comment) {
    if (!comment) return '';

    const ext = path.extname(filePath).toLowerCase();

    // 파일 타입별 주석 형식
    switch (ext) {
        // 스크립트 언어 (C 스타일 주석)
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
        case '.java':
        case '.c':
        case '.cpp':
        case '.cs':
        case '.go':
        case '.php':
        case '.swift':
        case '.kt':
        case '.scala':
            return `/**\n * ${comment}\n */\n\n`;

        // 스크립트 언어 (# 주석)
        case '.py':
        case '.rb':
        case '.pl':
        case '.r':
        case '.sh':
        case '.bash':
        case '.zsh':
        case '.yml':
        case '.yaml':
            return `# ${comment}\n\n`;

        // 마크업 언어
        case '.html':
        case '.xml':
        case '.svg':
            return `<!--\n  ${comment}\n-->\n\n`;

        // CSS 계열
        case '.css':
        case '.scss':
        case '.sass':
        case '.less':
            return `/*\n * ${comment}\n */\n\n`;

        // Lua
        case '.lua':
            return `--[[\n  ${comment}\n]]\n\n`;

        // SQL
        case '.sql':
            return `-- ${comment}\n\n`;

        // 문서 및 기타
        case '.md':
        case '.markdown':
            return `<!-- ${comment} -->\n\n`;

        case '.tex':
            return `% ${comment}\n\n`;

        // 기본 주석 (모르는 확장자의 경우)
        default:
            return `/* ${comment} */\n\n`;
    }
}

module.exports = {
    createFilesAndDirectories,
};