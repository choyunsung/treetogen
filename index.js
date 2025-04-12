#!/usr/bin/env node
// index.js - 디렉토리 트리 생성기 메인 스크립트

const fs = require('fs');
const path = require('path');
const { generateDirectoryStructure } = require('./tree-generator');
const { generateFromTreeText } = require('./tree-parser');
const { startInteractiveCLI } = require('./interactive-cli');

// 명령행 인수 처리
const args = process.argv.slice(2);
const command = args[0];

// 도움말 표시
function showHelp() {
    console.log(`
디렉토리 트리 생성기 - 텍스트 트리 구조를 기반으로 디렉토리와 파일을 생성합니다.

사용법:
  node index.js <명령> [옵션]

명령:
  create <트리텍스트 또는 파일> <대상디렉토리>   트리 구조를 생성합니다.
  interactive                                   대화형 모드로 실행합니다.
  help                                          도움말을 표시합니다.

옵션:
  --text      트리 텍스트를 직접 입력합니다. (create 명령과 함께 사용)
  --file      트리 텍스트 파일 경로를 지정합니다. (create 명령과 함께 사용)

예시:
  node index.js create --text "backend/\\n├── server.js" ./output
  node index.js create --file tree.txt ./output
  node index.js interactive
  `);
}

// 스크립트 실행
function main() {
    // 명령이 없는 경우 대화형 모드로 실행
    if (!command || command === 'interactive') {
        startInteractiveCLI();
        return;
    }

    // 도움말 표시
    if (command === 'help') {
        showHelp();
        return;
    }

    // 트리 구조 생성
    if (command === 'create') {
        if (args.length < 3) {
            console.error('오류: 인수가 부족합니다.');
            showHelp();
            return;
        }

        const option = args[1];
        let treeInput = args[2];
        const targetDir = args[3] || process.cwd();

        // 텍스트 직접 입력 모드
        if (option === '--text') {
            generateFromTreeText(treeInput, targetDir);
        }
        // 파일 입력 모드
        else if (option === '--file') {
            try {
                const treeText = fs.readFileSync(treeInput, 'utf8');
                generateFromTreeText(treeText, targetDir);
            } catch (err) {
                console.error(`파일을 읽을 수 없습니다: ${err.message}`);
            }
        }
        // 옵션이 없는 경우 입력 타입 자동 감지
        else {
            if (fs.existsSync(option) && fs.statSync(option).isFile()) {
                // 파일인 경우
                try {
                    const treeText = fs.readFileSync(option, 'utf8');
                    generateFromTreeText(treeText, treeInput);
                } catch (err) {
                    console.error(`파일을 읽을 수 없습니다: ${err.message}`);
                }
            } else {
                // 직접 텍스트인 경우
                generateFromTreeText(option, treeInput);
            }
        }
        return;
    }

    // 알 수 없는 명령
    console.error(`알 수 없는 명령: ${command}`);
    showHelp();
}

// 메인 함수 실행
main();