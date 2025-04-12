#define MyAppName "TreeToGen"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Your Name or Company"
#define MyAppURL "https://github.com/yourusername/treetogen"
#define MyAppExeName "treetogen.exe"

[Setup]
; 기본 설정
AppId={{8A4D6E1F-C9E3-4F3A-8B44-1D14C05E7C2A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=LICENSE
OutputDir=installer
OutputBaseFilename=treetogen-setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "addtopath"; Description: "PATH 환경 변수에 추가하기"; GroupDescription: "시스템 통합:"; Flags: unchecked

[Files]
Source: "dist\treetogen.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: "help"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
const
  EnvironmentKey = 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment';

procedure EnvAddPath(Path: string);
var
  Paths: string;
begin
  { 레지스트리에서 PATH 환경 변수를 읽습니다 }
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', Paths) then
  begin
    Paths := '';
  end;

  { 이미 PATH에 있는지 확인합니다 }
  if Pos(';' + Uppercase(Path) + ';', ';' + Uppercase(Paths) + ';') = 0 then
  begin
    Paths := Paths + ';' + Path + ';'

    { 연속된 세미콜론 제거 }
    StringChangeEx(Paths, ';;', ';', True);

    { PATH 환경 변수 업데이트 }
    RegWriteExpandStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', Paths);
  end;
end;

procedure EnvRemovePath(Path: string);
var
  Paths: string;
  P: Integer;
begin
  { 레지스트리에서 PATH 환경 변수를 읽습니다 }
  if RegQueryStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', Paths) then
  begin
    { 앞에 세미콜론 추가해서 패턴 매칭 쉽게 만들기 }
    Paths := ';' + Paths;

    { PATH에서 해당 경로 제거 }
    P := Pos(';' + Uppercase(Path), Uppercase(Paths));
    if P > 0 then
    begin
      Delete(Paths, P, Length(Path) + 1);

      { 연속된 세미콜론 제거 }
      StringChangeEx(Paths, ';;', ';', True);

      { 처음의 세미콜론 제거 }
      if Paths[1] = ';' then
        Delete(Paths, 1, 1);

      { PATH 환경 변수 업데이트 }
      RegWriteExpandStringValue(HKEY_LOCAL_MACHINE, EnvironmentKey, 'Path', Paths);
    end;
  end;
end;

{ 설치 이후에 PATH에 추가 }
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if IsTaskSelected('addtopath') then
      EnvAddPath(ExpandConstant('{app}'));
  end;
end;

{ 제거 시 PATH에서 제거 }
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    EnvRemovePath(ExpandConstant('{app}'));
  end;
end;