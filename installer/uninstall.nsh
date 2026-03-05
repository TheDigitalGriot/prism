; =============================================================================
;  Uninstaller — Add/Remove Programs integration + cleanup
;  Translates: all uninstall* functions from cmd/prism-setup/src/installer/
; =============================================================================

; Called from Section -Post at install time
Function WriteUninstallEntry
  WriteUninstaller "$INSTDIR\uninstall.exe"

  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "QuietUninstallString" '"$INSTDIR\uninstall.exe" /S'
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "https://github.com/TheDigitalGriot/prism-plugin"
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoRepair" 1
FunctionEnd

; =============================================================================

Section "Uninstall"

  ; --- Remove CLI binary ---
  DetailPrint "Removing Prism CLI..."
  Delete "$INSTDIR\bin\prism-cli.exe"

  ; --- Remove from PATH ---
  DetailPrint "Removing from PATH..."
  EnVar::SetHKCU
  EnVar::DeleteValue "PATH" "$INSTDIR\bin"
  Pop $0
  SendMessage ${HWND_BROADCAST} ${WM_SETTINGCHANGE} 0 "STR:Environment" /TIMEOUT=5000

  ; --- Uninstall VSCode extension (try all editors) ---
  DetailPrint "Removing VSCode extension..."
  nsExec::ExecToStack 'where.exe code'
  Pop $0
  Pop $1
  ${If} $0 == 0
    nsExec::ExecToLog 'cmd.exe /c "code" --uninstall-extension prism.prism'
    Pop $0
  ${EndIf}

  nsExec::ExecToStack 'where.exe cursor'
  Pop $0
  Pop $1
  ${If} $0 == 0
    nsExec::ExecToLog 'cmd.exe /c "cursor" --uninstall-extension prism.prism'
    Pop $0
  ${EndIf}

  nsExec::ExecToStack 'where.exe windsurf'
  Pop $0
  Pop $1
  ${If} $0 == 0
    nsExec::ExecToLog 'cmd.exe /c "windsurf" --uninstall-extension prism.prism'
    Pop $0
  ${EndIf}

  ; --- Remove Claude plugin ---
  DetailPrint "Removing Claude plugin..."
  nsExec::ExecToStack 'where.exe claude'
  Pop $0
  Pop $1
  ${If} $0 == 0
    nsExec::ExecToLog 'cmd.exe /c "claude" plugin uninstall prism@prism-marketplace'
    Pop $0
  ${EndIf}

  ; Clean up directly-copied plugin files (fallback path)
  Delete "$PROFILE\.claude\commands\prism*.md"
  Delete "$PROFILE\.claude\commands\create_plan.md"
  Delete "$PROFILE\.claude\commands\create_handoff.md"
  Delete "$PROFILE\.claude\commands\decompose_plan.md"
  Delete "$PROFILE\.claude\commands\describe_pr.md"
  Delete "$PROFILE\.claude\commands\generate_prd.md"
  Delete "$PROFILE\.claude\commands\generate_pricing.md"
  Delete "$PROFILE\.claude\commands\generate_tech_spec.md"
  Delete "$PROFILE\.claude\commands\commit.md"

  ; --- Remove installed files ---
  DetailPrint "Removing installed files..."
  RMDir /r "$INSTDIR\extensions"
  RMDir /r "$INSTDIR\plugin"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR\bin"
  RMDir "$INSTDIR"

  ; --- Remove registry entries ---
  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "Software\Prism"

  DetailPrint "Uninstall complete."

SectionEnd
