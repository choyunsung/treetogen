# TreeToGen - Standalone Directory Tree Generator  
**TreeToGen - 독립 실행형 디렉토리 트리 생성기**

TreeToGen is a tool that automatically creates a real file system from a text-based directory tree.  
Node.js or any other dependency is **not required** — just run the executable.

TreeToGen은 텍스트로 작성된 디렉토리 트리 구조를 기반으로 실제 디렉토리와 파일을 생성하는 **독립 실행형 도구**입니다.  
Node.js나 기타 의존성 설치 없이 바로 실행할 수 있습니다.

---

## 🧩 Features | 주요 특징

- **Single Executable** – Run without Node.js  
  **단일 실행 파일** – Node.js 설치 없이 실행 가능  
- **Cross-platform** – Supports Windows, macOS, Linux  
  **크로스 플랫폼** – Windows, macOS, Linux 지원  
- **Parses Text Trees** – Accepts various tree formats  
  **텍스트 트리 인식** – 다양한 형식의 트리 텍스트 지원  
- **Interactive Mode Only** – Clean and simplified usage  
  **대화형 모드 전용** – 더욱 간단하고 직관적인 사용 방식  

---

## 📦 Download & Install | 다운로드 및 설치

### Windows

1. [Releases 페이지](https://github.com/yourusername/treetogen/releases)에서 `treetogen-windows.zip` 다운로드  
2. 압축 해제 후 `treetogen.exe` 실행  
3. 명령 프롬프트 또는 PowerShell에서 실행하거나 더블 클릭으로 실행  
4. 시스템 PATH에 추가하면 어디서든 실행 가능

### macOS / Linux

1. `treetogen-macos.zip` 또는 `treetogen-linux.zip` 다운로드  
2. 압축 해제 후 실행 파일을 원하는 위치로 이동  
3. 실행 권한 부여:
   ```bash
   chmod +x /path/to/treetogen
   ```

---

## 🛠️ How to Use | 사용 방법

### Run Interactive Mode | 대화형 모드 실행

```bash
# Windows
treetogen.exe

# macOS / Linux
./treetogen
```

Follow the prompts to enter or paste your directory tree text, then select the target path.  
입력 안내에 따라 트리 텍스트를 붙여넣고, 생성할 경로를 지정하면 자동으로 생성됩니다.

### Example Input | 입력 형식 예시

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

---

## 🧭 Add to PATH (Optional) | 시스템 PATH에 추가 (선택 사항)

### Windows

1. 실행 파일을 `C:\Program Files\TreeToGen\` 등 고정 폴더에 복사  
2. ‘시스템 환경 변수 편집’ → ‘환경 변수’ → ‘Path’ 편집 → 폴더 경로 추가

### macOS / Linux

```bash
sudo cp /path/to/treetogen /usr/local/bin/
sudo chmod +x /usr/local/bin/treetogen
```

---

## 📝 License | 라이선스

MIT License.  
See [LICENSE](https://github.com/yourusername/treetogen/blob/main/LICENSE) for full details.

MIT 라이선스를 따릅니다. 자세한 내용은 LICENSE 파일을 참고하세요.
