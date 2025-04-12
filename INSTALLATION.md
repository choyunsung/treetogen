# 설치 프로그램 만들기 안내

이 문서는 각 운영체제별로 TreeToGen의 설치 프로그램을 만드는 방법을 설명합니다.

## Windows 설치 프로그램

Windows용 설치 프로그램은 Inno Setup을 사용하여 만듭니다.

### 필요 사항
- [Inno Setup](https://jrsoftware.org/isdl.php) 6.0 이상 설치
- 빌드된 TreeToGen 실행 파일 (`dist/treetogen.exe`)

### 설치 프로그램 생성 단계

1. Inno Setup Compiler를 설치합니다.
2. 먼저 실행 파일을 빌드합니다:
   ```
   node build.js
   ```
3. 프로젝트 루트에 `installer` 폴더를 생성합니다:
   ```
   mkdir installer
   ```
4. Inno Setup Compiler를 실행하고 `inno-setup-script.iss` 파일을 열어 컴파일합니다.
5. 완성된 설치 프로그램은 `installer` 폴더에 `treetogen-setup.exe` 파일로 생성됩니다.

## macOS 패키지 만들기

macOS용 `.pkg` 패키지는 다음 단계로 만듭니다.

### 필요 사항
- macOS 시스템
- 빌드된 TreeToGen 실행 파일 (`dist/treetogen`)

### 패키지 생성 단계

1. 먼저 실행 파일을 빌드합니다:
   ```
   node build.js
   ```

2. 패키지 구조를 만듭니다:
   ```bash
   # 패키지 구조 생성
   mkdir -p pkg-root/usr/local/bin
   
   # 실행 파일 복사 및 권한 설정
   cp dist/treetogen pkg-root/usr/local/bin/
   chmod +x pkg-root/usr/local/bin/treetogen
   ```

3. pkgbuild를 사용하여 패키지를 만듭니다:
   ```bash
   pkgbuild --root pkg-root --identifier com.yourdomain.treetogen --version 1.0.0 treetogen-1.0.0.pkg
   ```

4. (선택사항) 설치 프로그램에 UI를 추가하려면 productbuild를 사용합니다:
   ```bash
   productbuild --distribution distribution.xml --package-path . treetogen-1.0.0-installer.pkg
   ```

## Linux 패키지 만들기

Linux용 `.deb` 패키지(Debian/Ubuntu용)와 `.rpm` 패키지(Fedora/CentOS용)를 만듭니다.

### 필요 사항
- Linux 시스템
- `dpkg-deb`(deb 패키지용) 또는 `rpmbuild`(rpm 패키지용)
- 빌드된 TreeToGen 실행 파일 (`dist/treetogen`)

### .deb 패키지 생성 단계

1. 먼저 실행 파일을 빌드합니다:
   ```
   node build.js
   ```

2. 패키지 구조를 만듭니다:
   ```bash
   # 패키지 구조 생성
   mkdir -p treetogen_1.0.0-1_amd64/usr/local/bin
   mkdir -p treetogen_1.0.0-1_amd64/DEBIAN
   
   # 실행 파일 복사 및 권한 설정
   cp dist/treetogen treetogen_1.0.0-1_amd64/usr/local/bin/
   chmod +x treetogen_1.0.0-1_amd64/usr/local/bin/treetogen
   ```

3. 제어 파일을 생성합니다:
   ```bash
   cat > treetogen_1.0.0-1_amd64/DEBIAN/control << EOF
   Package: treetogen
   Version: 1.0.0-1
   Section: utils
   Priority: optional
   Architecture: amd64
   Maintainer: Your Name <your.email@example.com>
   Description: Directory tree generator
    TreeToGen is a tool that creates directory structures from text representations.
   EOF
   ```

4. .deb 패키지를 생성합니다:
   ```bash
   dpkg-deb --build treetogen_1.0.0-1_amd64
   ```

### .rpm 패키지 생성 단계

1. 먼저 실행 파일을 빌드합니다:
   ```
   node build.js
   ```

2. RPM 빌드 디렉토리 구조를 만듭니다:
   ```bash
   mkdir -p ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
   ```

3. spec 파일을 생성합니다:
   ```bash
   cat > ~/rpmbuild/SPECS/treetogen.spec << EOF
   Name: treetogen
   Version: 1.0.0
   Release: 1%{?dist}
   Summary: Directory tree generator
   
   License: MIT
   URL: https://github.com/yourusername/treetogen
   
   %description
   TreeToGen is a tool that creates directory structures from text representations.
   
   %install
   mkdir -p %{buildroot}/usr/local/bin
   cp %{_sourcedir}/treetogen %{buildroot}/usr/local/bin/
   chmod +x %{buildroot}/usr/local/bin/treetogen
   
   %files
   /usr/local/bin/treetogen
   
   %changelog
   * $(date '+%a %b %d %Y') Your Name <your.email@example.com> - 1.0.0-1
   - Initial package
   EOF
   ```

4. 소스 디렉토리에 실행 파일을 복사합니다:
   ```bash
   cp dist/treetogen ~/rpmbuild/SOURCES/
   ```

5. RPM 패키지를 빌드합니다:
   ```bash
   rpmbuild -ba ~/rpmbuild/SPECS/treetogen.spec
   ```

## 배포

각 패키지를 생성한 후, GitHub Releases 또는 웹사이트를 통해 배포할 수 있습니다. 다음 파일들이 생성됩니다:

- Windows: `treetogen-setup.exe`
- macOS: `treetogen-1.0.0.pkg`
- Debian/Ubuntu: `treetogen_1.0.0-1_amd64.deb`
- Fedora/CentOS: `treetogen-1.0.0-1.x86_64.rpm`