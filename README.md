# TreeToGen - 독립 실행형 디렉토리 트리 생성기

이 프로그램은 텍스트 형식의 디렉토리 트리를 입력하면 실제 파일 시스템에 해당 구조를 자동으로 생성하는 **독립 실행형** 도구입니다. Node.js나 기타 의존성을 설치할 필요 없이 바로 실행할 수 있습니다.

## 특징

- **단일 실행 파일**: Node.js 설치 없이 바로 실행 가능
- **크로스 플랫폼**: Windows, macOS, Linux 지원
- **텍스트 트리 인식**: 다양한 형식의 디렉토리 트리 텍스트 지원
- **대화형 인터페이스**: 단계별 안내를 통한 간편한 사용

## 다운로드 및 설치

### Windows

1. [다운로드 페이지](https://github.com/yourusername/treetogen/releases)에서 `treetogen-windows.zip` 파일을 다운로드합니다.
2. 압축을 풀고 `treetogen.exe` 파일을 원하는 위치에 복사합니다.
3. 실행하려면 명령 프롬프트 또는 PowerShell에서 해당 파일 경로로 이동한 후 실행하거나, 파일을 더블클릭합니다.

### macOS

1. [다운로드 페이지](https://github.com/yourusername/treetogen/releases)에서 `treetogen-macos.zip` 파일을 다운로드합니다.
2. 압축을 풀고 `treetogen` 파일을 원하는 위치(예: `/usr/local/bin/`)에 복사합니다.
3. 터미널에서 실행 권한을 부여합니다: `chmod +x /path/to/treetogen`

### Linux

1. [다운로드 페이지](https://github.com/yourusername/treetogen/releases)에서 `treetogen-linux.zip` 파일을 다운로드합니다.
2. 압축을 풀고 `treetogen` 파일을 원하는 위치(예: `/usr/local/bin/`)에 복사합니다.
3. 터미널에서 실행 권한을 부여합니다: `chmod +x /path/to/treetogen`

## 사용 방법

### 기본 명령어

```
# 도움말 보기
treetogen help

# 대화형 모드 실행
treetogen interactive

# 텍스트에서 디렉토리 구조 생성
treetogen create --text "디렉토리구조" 대상경로

# 파일에서 디렉토리 구조 생성
treetogen create --file 트리파일.txt 대상경로
```

### 대화형 모드 사용하기

가장 쉬운 사용 방법은 대화형 모드입니다:

1. 실행 파일이 있는 디렉토리에서 터미널이나 명령 프롬프트를 열고 다음을 실행합니다:
   ```
   # Windows
   treetogen.exe interactive
   
   # macOS/Linux
   ./treetogen interactive
   ```

2. 화면의 지시에 따라 트리 구조를 입력하거나 파일을 선택합니다.

### 입력 형식 예시

다음과 같은 형식의 트리 구조를 입력할 수 있습니다:

```
backend/
├── Dockerfile
├── docker-compose.yml
├── server.js
├── sockets/
│   └── socket_server.js
├── api/
│   ├── metals_api.js
│   └── bond_api.js
└── queue/
    └── bull_worker.js
```

## PATH에 추가하기 (선택사항)

프로그램을 어디서든 실행할 수 있도록 시스템 PATH에 추가할 수 있습니다.

### Windows

1. 실행 파일을 고정된 위치(예: `C:\Program Files\TreeToGen\`)에 복사합니다.
2. 시작 메뉴에서 '시스템 환경 변수 편집'을 검색하여 실행합니다.
3. '환경 변수' 버튼을 클릭합니다.
4. '시스템 변수' 섹션에서 'Path' 변수를 선택하고 '편집'을 클릭합니다.
5. '새로 만들기'를 클릭하고 실행 파일이 있는 경로(예: `C:\Program Files\TreeToGen\`)를 추가합니다.
6. '확인'을 클릭하여 모든 창을 닫습니다.

### macOS

터미널에서 다음 명령을 실행합니다:

```bash
# 실행 파일을 /usr/local/bin으로 복사 (관리자 권한 필요)
sudo cp /path/to/treetogen /usr/local/bin/

# 실행 권한 부여
sudo chmod +x /usr/local/bin/treetogen
```

### Linux

터미널에서 다음 명령을 실행합니다:

```bash
# 실행 파일을 /usr/local/bin으로 복사 (관리자 권한 필요)
sudo cp /path/to/treetogen /usr/local/bin/

# 실행 권한 부여
sudo chmod +x /usr/local/bin/treetogen
```

## 소스에서 빌드하기

소스 코드에서 직접 실행 파일을 빌드하려면:

1. 저장소 클론:
   ```
   git clone https://github.com/yourusername/treetogen.git
   cd treetogen
   ```

2. 의존성 설치:
   ```
   npm install
   ```

3. 실행 파일 빌드:
   ```
   node build.js
   ```

   또는 모든 플랫폼용 빌드:
   ```
   node build.js --all
   ```

4. `dist` 폴더에서 빌드된 실행 파일을 찾을 수 있습니다.

## 라이선스

MIT