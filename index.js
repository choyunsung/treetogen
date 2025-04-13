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
  node index.js <tree-text> <target-directory>

명령:
    help                                          도움말을 표시합니다.

예시:
  node index.js "backend/\\n├── server.js" . 
  `);
}

// 스크립트 실행
function main() {

    // 도움말 표시
    if (command === 'help') {
        showHelp();
        return;
    }

    if (args.length === 0) {
        startInteractiveCLI().then(()=> {
            console.log('대화형 CLI 종료');
        });
    }else{
        console.error('오류: 인수가 부족합니다.');
        showHelp();
        return;
    }

}

// 메인 함수 실행
main();