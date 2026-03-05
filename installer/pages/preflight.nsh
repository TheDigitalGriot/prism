; =============================================================================
;  System Check — Custom NsDialogs page
;  Translates: cmd/prism-setup/src/screens/SystemCheckScreen.tsx + detect.ts
; =============================================================================

Var hPreflightDlg
Var PreflightEditorStatus
Var PreflightClaudeStatus
Var PreflightPrismStatus

Function PreflightPageCreate
  !insertmacro MUI_HEADER_TEXT "System Check" \
    "Detecting installed tools before installation begins."

  nsDialogs::Create 1018
  Pop $hPreflightDlg
  ${If} $hPreflightDlg == error
    Abort
  ${EndIf}

  ; --- Title ---
  ${NSD_CreateLabel} 0 0 100% 16u \
    "The following tools were detected on your system:"
  Pop $0

  ; --- Editor detection ---
  StrCpy $PreflightEditorStatus "Not found"
  nsExec::ExecToStack 'where.exe code'
  Pop $0
  Pop $1
  ${If} $0 == 0
    StrCpy $PreflightEditorStatus "VS Code found"
  ${EndIf}

  ${If} $PreflightEditorStatus == "Not found"
    nsExec::ExecToStack 'where.exe cursor'
    Pop $0
    Pop $1
    ${If} $0 == 0
      StrCpy $PreflightEditorStatus "Cursor found"
    ${EndIf}
  ${EndIf}

  ${If} $PreflightEditorStatus == "Not found"
    nsExec::ExecToStack 'where.exe windsurf'
    Pop $0
    Pop $1
    ${If} $0 == 0
      StrCpy $PreflightEditorStatus "Windsurf found"
    ${EndIf}
  ${EndIf}

  ${NSD_CreateLabel} 0 24u 35% 12u "Code Editor:"
  Pop $0
  ${NSD_CreateLabel} 36% 24u 64% 12u "$PreflightEditorStatus"
  Pop $0

  ; --- Claude CLI detection ---
  StrCpy $PreflightClaudeStatus "Not found (will use file copy fallback)"
  nsExec::ExecToStack 'where.exe claude'
  Pop $0
  Pop $1
  ${If} $0 == 0
    StrCpy $PreflightClaudeStatus "Claude CLI found"
  ${EndIf}

  ${NSD_CreateLabel} 0 42u 35% 12u "Claude CLI:"
  Pop $0
  ${NSD_CreateLabel} 36% 42u 64% 12u "$PreflightClaudeStatus"
  Pop $0

  ; --- Existing prism-cli detection ---
  StrCpy $PreflightPrismStatus "Not installed"
  nsExec::ExecToStack 'where.exe prism-cli'
  Pop $0
  Pop $1
  ${If} $0 == 0
    StrCpy $PreflightPrismStatus "Already installed (will be updated)"
  ${EndIf}

  ${NSD_CreateLabel} 0 60u 35% 12u "Prism CLI:"
  Pop $0
  ${NSD_CreateLabel} 36% 60u 64% 12u "$PreflightPrismStatus"
  Pop $0

  ; --- Separator ---
  ${NSD_CreateHLine} 0 82u 100% 1u
  Pop $0

  ; --- Info text ---
  ${NSD_CreateLabel} 0 90u 100% 24u \
    "Click Next to begin installation. Components will adapt to what is available on your system."
  Pop $0

  nsDialogs::Show

FunctionEnd

Function PreflightPageLeave
  ; Informational only — no validation needed
FunctionEnd
