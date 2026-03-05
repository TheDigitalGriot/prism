; =============================================================================
;  Claude Code Plugin — Optional, checked by default
;  Translates: cmd/prism-setup/src/installer/install-plugin.ts
; =============================================================================

Section "Claude Code Plugin" SEC_PLUGIN

  ; --- Stage plugin files to $INSTDIR\plugin\ ---
  DetailPrint "Extracting Claude plugin files..."
  SetOutPath "$INSTDIR\plugin\commands"
  File /r "${RESOURCES_DIR}\plugin\commands\*.*"

  SetOutPath "$INSTDIR\plugin\agents"
  File /r "${RESOURCES_DIR}\plugin\agents\*.*"

  ; --- Try Claude CLI install first ---
  nsExec::ExecToStack 'where.exe claude'
  Pop $0
  Pop $1
  ${If} $0 == 0
    DetailPrint "Claude CLI found. Installing plugin via marketplace..."
    nsExec::ExecToLog 'cmd.exe /c "claude" plugin install prism@prism-marketplace'
    Pop $0
    ${If} $0 == 0
      DetailPrint "Plugin installed via Claude CLI."
      Goto plugin_done
    ${Else}
      DetailPrint "Claude CLI install returned $0. Falling back to file copy..."
    ${EndIf}
  ${Else}
    DetailPrint "Claude CLI not found. Using direct file copy..."
  ${EndIf}

  ; --- Fallback: copy directly to %USERPROFILE%\.claude\ ---
  CreateDirectory "$PROFILE\.claude"
  CreateDirectory "$PROFILE\.claude\commands"
  CreateDirectory "$PROFILE\.claude\agents"

  CopyFiles /SILENT "$INSTDIR\plugin\commands\*.*" "$PROFILE\.claude\commands"
  CopyFiles /SILENT "$INSTDIR\plugin\agents\*.*" "$PROFILE\.claude\agents"

  DetailPrint "Plugin files copied to $PROFILE\.claude\"

  plugin_done:

SectionEnd

LangString DESC_PLUGIN ${LANG_ENGLISH} \
  "Installs Prism workflow commands for Claude Code. Uses Claude CLI if available, otherwise copies files directly."
