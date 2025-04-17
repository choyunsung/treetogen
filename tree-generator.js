const fs = require('fs');
const path = require('path');

/**
 * 텍스트 형식의 디렉토리 트리를 전처리하고 정규화합니다.
 * @param {string} treeText - 원본 트리 텍스트
 * @returns {string} 정규화된 트리 텍스트
 */
function preprocessTreeText(treeText) {
    if (!treeText) return '';

    // 1. 마크다운 코드 블록 제거
    let processed = treeText.replace(/^```[\s\S]*?```$/gm, '');
    processed = processed.replace(/^```[\s\S]*$/gm, '');
    processed = processed.replace(/^[\s\S]*?```$/gm, '');

    // 2. 각 라인별로 처리
    const lines = processed.split('\n');
    const normalizedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimRight();
        if (!line.trim()) continue;

        // 3. 백슬래시를 슬래시로 변환 (윈도우/리눅스 경로 혼합 처리)
        line = line.replace(/\\/g, '/');

        // 4. 해시 주석을 표준 주석으로 변환
        line = line.replace(/\s*#\s*(.*?)$/, ' // $1');

        // 5. 라인이 너무 길어 여러 항목이 한 줄에 있는 경우 분리
        if ((line.match(/├──/g) || []).length > 1 ||
            (line.match(/└──/g) || []).length > 1 ||
            (line.indexOf('├──') >= 0 && line.indexOf('└──') >= 0)) {

            // 트리 기호 위치 찾기
            let positions = [];
            let pos = -1;

            // ├── 위치 찾기
            while ((pos = line.indexOf('├──', pos + 1)) !== -1) {
                positions.push({ pos, symbol: '├──' });
            }

            // └── 위치 찾기
            pos = -1;
            while ((pos = line.indexOf('└──', pos + 1)) !== -1) {
                positions.push({ pos, symbol: '└──' });
            }

            // 위치 순으로 정렬
            positions.sort((a, b) => a.pos - b.pos);

            // 각 위치에서 라인 분리
            if (positions.length > 1) {
                let start = 0;
                for (let j = 0; j < positions.length; j++) {
                    const current = positions[j];

                    // 현재 위치가 시작점이면 건너뛰기
                    if (current.pos === start) {
                        continue;
                    }

                    // 이전 부분 추출하여 추가
                    if (current.pos > start) {
                        const part = line.substring(start, current.pos).trim();
                        if (part) normalizedLines.push(part);
                    }

                    start = current.pos;
                }

                // 마지막 부분 추가
                if (start < line.length) {
                    normalizedLines.push(line.substring(start).trim());
                }
            } else {
                normalizedLines.push(line);
            }
        } else {
            normalizedLines.push(line);
        }
    }

    return normalizedLines.join('\n');
}

/**
 * 텍스트 형식의 디렉토리 트리를 파싱하여 계층적 구조로 변환합니다.
 * @param {string} treeText - 트리 구조 텍스트
 * @returns {Array} 계층적 트리 구조 정보
 */
function generateDirectoryStructure(treeText) {
    // 입력 트리 텍스트 전처리
    const processedText = preprocessTreeText(treeText);

    // 라인으로 분리하고 빈 줄 제거
    const lines = processedText.split('\n').filter(line => line.trim() !== '');

    // 처리할 줄이 없으면 종료
    if (lines.length === 0) {
        console.log('유효한 트리 구조가 아닙니다.');
        return [];
    }

    // 이 트리가 루트 디렉토리를 가지고 있는지 확인
    const hasSingleRoot = detectSingleRoot(lines);

    // 트리 구조 노드 배열
    const treeNodes = [];

    // 경로 추적을 위한 스택
    const pathStack = [];
    let lastLevel = -1;

    // 단일 루트 케이스 처리
    if (hasSingleRoot) {
        // 첫 번째 줄이 루트 디렉토리명
        const rootLine = lines[0].trim();
        const rootName = rootLine.split('//')[0].trim();

        // 루트 노드 추가
        const rootComment = rootLine.includes('//') ? rootLine.split('//')[1].trim() : '';

        const rootNode = {
            name: rootName,
            isDirectory: true,
            level: 0,
            parent: null,
            path: rootName,
            children: [],
            comment: rootComment
        };

        treeNodes.push(rootNode);
        pathStack.push(rootNode);
        lastLevel = 0;

        // 첫 번째 줄을 제외하고 처리
        processLines(lines.slice(1), treeNodes, pathStack, lastLevel);
    } else {
        // 다중 루트 케이스 처리
        processLines(lines, treeNodes, pathStack, lastLevel);
    }

    return treeNodes;
}

/**
 * 트리 텍스트가 단일 루트 디렉토리를 가지고 있는지 확인합니다.
 * @param {Array} lines - 트리 텍스트 라인 배열
 * @returns {boolean} 단일 루트 디렉토리 여부
 */
function detectSingleRoot(lines) {
    if (lines.length === 0) return false;

    const firstLine = lines[0].trim();
    // 첫 번째 줄이 들여쓰기나 트리 기호가 없으면 루트 디렉토리로 간주
    return !firstLine.includes('├') && !firstLine.includes('└') && !firstLine.includes('│');
}

/**
 * 트리 라인을 처리하여 노드 배열에 추가합니다.
 * @param {Array} lines - 트리 텍스트 라인 배열
 * @param {Array} treeNodes - 노드 배열
 * @param {Array} pathStack - 경로 스택
 * @param {number} lastLevel - 마지막 처리 레벨
 */
function processLines(lines, treeNodes, pathStack, lastLevel) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // 노드 정보 파싱
        const nodeInfo = parseNodeFromLine(line);
        if (!nodeInfo) continue;

        const { name, isDirectory, level, comment } = nodeInfo;

        // 스택 및 경로 조정
        while (pathStack.length > 0 && level <= lastLevel) {
            pathStack.pop();
            lastLevel--;
        }

        // 현재 경로 계산
        let currentPath = '';
        if (pathStack.length > 0) {
            const parentNode = pathStack[pathStack.length - 1];
            currentPath = parentNode.path + '/' + name;
        } else {
            currentPath = name;
        }

        // 노드 생성
        const newNode = {
            name,
            isDirectory,
            level,
            path: currentPath,
            parent: pathStack.length > 0 ? pathStack[pathStack.length - 1] : null,
            children: [],
            comment: comment || ''
        };

        // 노드 배열에 추가
        treeNodes.push(newNode);

        // 부모-자식 관계 설정
        if (pathStack.length > 0) {
            const parentNode = pathStack[pathStack.length - 1];
            parentNode.children.push(newNode);
        }

        // 디렉토리인 경우 스택에 추가
        if (isDirectory) {
            pathStack.push(newNode);
            lastLevel = level;
        }
    }
}

/**
 * 트리 라인에서 노드 정보를 파싱합니다.
 * @param {string} line - 트리 라인
 * @returns {Object|null} 노드 정보 또는 null
 */
function parseNodeFromLine(line) {
    // 트리 기호 확인
    let treeSymbolPos = -1;
    let isLastItem = false;

    if (line.includes('├──')) {
        treeSymbolPos = line.indexOf('├──');
        isLastItem = false;
    } else if (line.includes('└──')) {
        treeSymbolPos = line.indexOf('└──');
        isLastItem = true;
    }

    if (treeSymbolPos >= 0) {
        // 들여쓰기 레벨 계산
        const level = Math.floor(treeSymbolPos / 4) + 1;

        // 트리 기호 이후 콘텐츠 추출
        const content = line.substring(treeSymbolPos + 4).trim();

        // 주석 분리
        let name = content;
        let comment = '';

        const commentPos = content.indexOf(' //');
        if (commentPos > 0) {
            name = content.substring(0, commentPos).trim();
            comment = content.substring(commentPos + 3).trim();
        }

        // 파일/디렉토리 여부 판단
        const isDirectory = !name.includes('.') || name.endsWith('/');

        return {
            name: name.replace(/\/$/, ''), // 끝의 슬래시 제거
            isDirectory,
            level,
            isLastItem,
            comment
        };
    } else if (!line.includes('│')) {
        // 루트 항목 (트리 기호 없음)
        const content = line.trim();

        // 주석이 있는지 확인
        const commentPos = content.indexOf(' //');
        let name = content;
        let comment = '';

        if (commentPos > 0) {
            name = content.substring(0, commentPos).trim();
            comment = content.substring(commentPos + 3).trim();
        }

        // 파일 또는 디렉토리 여부 판단
        const isDirectory = !name.includes('.') || name.endsWith('/');

        return {
            name: name.replace(/\/$/, ''), // 끝의 슬래시 제거
            isDirectory,
            level: 0, // 루트 레벨
            isLastItem: false,
            comment
        };
    }

    return null;
}

/**
 * 트리 구조를 포맷팅하여 문자열로 반환합니다.
 * @param {Array} treeStructure - 처리된 트리 구조 정보
 * @returns {string} 포맷팅된 트리 구조 문자열
 */
function formatTreeStructure(treeStructure) {
    if (!treeStructure || treeStructure.length === 0) {
        return '빈 트리 구조';
    }

    // 루트 노드들 찾기 (레벨이 0인 노드들)
    const rootNodes = treeStructure.filter(node => node.level === 0);

    if (rootNodes.length === 0) {
        // 레벨 0인 노드가 없으면 레벨 1인 노드를 루트로 간주
        const level1Nodes = treeStructure.filter(node => node.level === 1);
        if (level1Nodes.length > 0) {
            return formatMultiRootTree(level1Nodes, treeStructure);
        }
        return '루트 노드를 찾을 수 없습니다.';
    }

    // 단일 루트 케이스 - 루트가 하나인 경우
    if (rootNodes.length === 1) {
        return formatSingleRootTree(rootNodes[0], treeStructure);
    }

    // 다중 루트 케이스
    return formatMultiRootTree(rootNodes, treeStructure);
}

/**
 * 단일 루트 트리 구조를 포맷팅합니다.
 * @param {Object} rootNode - 루트 노드
 * @param {Array} treeStructure - 전체 트리 구조 정보
 * @returns {string} 포맷팅된 트리 구조 문자열
 */
function formatSingleRootTree(rootNode, treeStructure) {
    let result = '';

    // 루트 노드 출력
    const rootIcon = rootNode.isDirectory ? '📁' : '📄';
    result += `${rootIcon} ${rootNode.name}`;
    if (rootNode.comment) {
        result += ` // ${rootNode.comment}`;
    }
    result += '\n';

    // 자식 노드 포맷팅
    const children = rootNode.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isLast = i === children.length - 1;

        result += formatNodeAndChildren(child, '', isLast);
    }

    return result;
}

/**
 * 다중 루트 트리 구조를 포맷팅합니다.
 * @param {Array} rootNodes - 루트 노드 배열
 * @param {Array} treeStructure - 전체 트리 구조 정보
 * @returns {string} 포맷팅된 트리 구조 문자열
 */
function formatMultiRootTree(rootNodes, treeStructure) {
    let result = '';

    // 각 루트 노드에 대해
    for (let i = 0; i < rootNodes.length; i++) {
        const node = rootNodes[i];
        const isLast = i === rootNodes.length - 1;

        // 노드 아이콘
        const icon = node.isDirectory ? '📁' : '📄';

        // 첫 번째 노드 라인 포맷팅
        result += isLast ? '└── ' : '├── ';
        result += `${icon} ${node.name}`;
        if (node.comment) {
            result += ` // ${node.comment}`;
        }
        result += '\n';

        // 자식 노드 포맷팅
        const nextIndent = isLast ? '    ' : '│   ';
        const children = node.children;

        for (let j = 0; j < children.length; j++) {
            const child = children[j];
            const isLastChild = j === children.length - 1;

            result += formatNodeAndChildren(child, nextIndent, isLastChild);
        }
    }

    return result;
}

/**
 * 노드와 그 자식들을 포맷팅합니다.
 * @param {Object} node - 현재 노드
 * @param {string} indent - 들여쓰기
 * @param {boolean} isLast - 마지막 노드 여부
 * @returns {string} 포맷팅된 문자열
 */
function formatNodeAndChildren(node, indent, isLast) {
    let result = '';

    // 노드 아이콘
    const icon = node.isDirectory ? '📁' : '📄';

    // 노드 라인
    result += indent;
    result += isLast ? '└── ' : '├── ';
    result += `${icon} ${node.name}`;

    // 주석 추가
    if (node.comment) {
        result += ` // ${node.comment}`;
    }
    result += '\n';

    // 자식 노드 포맷팅
    const nextIndent = indent + (isLast ? '    ' : '│   ');
    const children = node.children;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isLastChild = i === children.length - 1;

        result += formatNodeAndChildren(child, nextIndent, isLastChild);
    }

    return result;
}

module.exports = {
    generateDirectoryStructure,
    formatTreeStructure,
};