; =============================================================================
;  VSCode Extension — Optional, checked by default
;  Translates: cmd/prism-setup/src/installer/install-vscode.ts
; =============================================================================

Section "VSCode Extension" SEC_VSCODE

  ; --- Bundle the VSIX ---
  DetailPrint "Extracting VSCode extension..."
  SetOutPath "$INSTDIR\extensions"
  File "${RESOURCES_DIR}\extensions\prism.vsix"

  ; --- Detect editors and try to install into each one found ---
  ; We try all detected editors, not just the first, so the extension
  ; gets installed into VS Code AND Cursor AND Windsurf if present.

  StrCpy $R1 "0"  ; count of successful installs

  ; --- Try VS Code ---
  nsExec::ExecToStack 'where.exe code'
  Pop $0
  Pop $1
  ${If} $0 == 0
    DetailPrint "Found VS Code, installing extension..."
    nsExec::ExecToStack 'cmd.exe /c code --install-extension "$INSTDIR\extensions\prism.vsix" --force'
    Pop $0
    Pop $1
    ${If} $0 == 0
      DetailPrint "Prism extension installed in VS Code."
      IntOp $R1 $R1 + 1
    ${Else}
      DetailPrint "VS Code install returned exit code $0: $1"
    ${EndIf}
  ${EndIf}

  ; --- Try Cursor ---
  nsExec::ExecToStack 'where.exe cursor'
  Pop $0
  Pop $1
  ${If} $0 == 0
    DetailPrint "Found Cursor, installing extension..."
    nsExec::ExecToStack 'cmd.exe /c cursor --install-extension "$INSTDIR\extensions\prism.vsix" --force'
    Pop $0
    Pop $1
    ${If} $0 == 0
      DetailPrint "Prism extension installed in Cursor."
      IntOp $R1 $R1 + 1
    ${Else}
      DetailPrint "Cursor install returned exit code $0: $1"
    ${EndIf}
  ${EndIf}

  ; --- Try Windsurf ---
  nsExec::ExecToStack 'where.exe windsurf'
  Pop $0
  Pop $1
  ${If} $0 == 0
    DetailPrint "Found Windsurf, installing extension..."
    nsExec::ExecToStack 'cmd.exe /c windsurf --install-extension "$INSTDIR\extensions\prism.vsix" --force'
    Pop $0
    Pop $1
    ${If} $0 == 0
      DetailPrint "Prism extension installed in Windsurf."
      IntOp $R1 $R1 + 1
    ${Else}
      DetailPrint "Windsurf install returned exit code $0: $1"
    ${EndIf}
  ${EndIf}

  ; --- Final result ---
  ${If} $R1 == 0
    DetailPrint "No editor successfully installed the extension."
    MessageBox MB_OK|MB_ICONINFORMATION \
      "The Prism extension could not be installed automatically.$\n$\nThe VSIX has been saved to:$\n$INSTDIR\extensions\prism.vsix$\n$\nYou can install it manually by running:$\ncode --install-extension $\"$INSTDIR\extensions\prism.vsix$\""
  ${Else}
    DetailPrint "Extension installed in $R1 editor(s)."
  ${EndIf}

SectionEnd

LangString DESC_VSCODE ${LANG_ENGLISH} \
  "Installs the Prism extension for VS Code, Cursor, and Windsurf. Tries all detected editors."
