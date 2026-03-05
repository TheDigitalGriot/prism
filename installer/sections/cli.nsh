; =============================================================================
;  Prism CLI — Required component
;  Translates: cmd/prism-setup/src/installer/install-cli.ts + path-config.ts
; =============================================================================

Section "Prism CLI (required)" SEC_CLI
  SectionIn RO  ; cannot be deselected

  ; --- Copy binary ---
  DetailPrint "Installing Prism CLI..."
  SetOutPath "$INSTDIR\bin"
  File "${RESOURCES_DIR}\binaries\prism-cli-windows-amd64.exe"
  Rename "$INSTDIR\bin\prism-cli-windows-amd64.exe" "$INSTDIR\bin\prism-cli.exe"

  ; --- Create %USERPROFILE%\.prism\bin\ ---
  CreateDirectory "$PROFILE\.prism"
  CreateDirectory "$PROFILE\.prism\bin"

  ; --- Create workspaces.json if not present ---
  IfFileExists "$PROFILE\.prism\workspaces.json" ws_exists
    FileOpen $0 "$PROFILE\.prism\workspaces.json" w
    FileWrite $0 '{"projects":[]}'
    FileClose $0
  ws_exists:

  ; --- Add $INSTDIR\bin to user PATH (idempotent via EnVar) ---
  DetailPrint "Configuring PATH..."
  EnVar::SetHKCU
  EnVar::AddValue "PATH" "$INSTDIR\bin"
  Pop $0
  ; 0 = success, 3 = already present — both fine

  ; --- Broadcast WM_SETTINGCHANGE so open terminals pick up PATH ---
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000

  ; --- Write install dir to registry ---
  WriteRegStr HKCU "Software\Prism" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Prism" "Version" "${VERSION}"

  DetailPrint "Prism CLI installed to $INSTDIR\bin\prism-cli.exe"

SectionEnd

LangString DESC_CLI ${LANG_ENGLISH} \
  "Prism CLI dashboard for managing development workspaces. Installed to $INSTDIR\bin\ and added to your PATH."
