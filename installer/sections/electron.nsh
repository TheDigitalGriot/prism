; =============================================================================
;  Prism Desktop App — Optional, unchecked by default
;  Translates: cmd/prism-setup/src/installer/install-electron.ts + download.ts
; =============================================================================

Section /o "Prism Desktop App" SEC_ELECTRON

  ; Use versioned asset name matching the Electron Forge output: Prism-{VERSION}.Setup.exe
  ; VERSION is passed at compile time via makensis -DVERSION=x.y.z
  !define ELECTRON_DL_URL \
    "https://github.com/TheDigitalGriot/prism-plugin/releases/download/v${VERSION}/Prism-${VERSION}.Setup.exe"

  DetailPrint "Downloading Prism Desktop App from GitHub..."

  NScurl::http GET "${ELECTRON_DL_URL}" "$TEMP\Prism-Desktop-Setup.exe" \
    /HEADER "User-Agent: Prism-Setup/${VERSION}" \
    /TIMEOUT 300000 \
    /CANCEL \
    /END
  Pop $0

  ${If} $0 != "OK"
    DetailPrint "Download failed: $0"
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Desktop app download failed: $0$\n$\nYou can download it manually from:$\nhttps://github.com/TheDigitalGriot/prism-plugin/releases/latest"
    Goto electron_cleanup
  ${EndIf}

  ; --- Run the installer silently ---
  DetailPrint "Running Prism Desktop installer..."
  nsExec::ExecToLog '"$TEMP\Prism-Desktop-Setup.exe" /S'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Desktop installer returned exit code $0"
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "The desktop app installer returned error code $0.$\n$\nYou can try running it manually:$\n$TEMP\Prism-Desktop-Setup.exe"
  ${Else}
    DetailPrint "Prism Desktop App installed successfully."
  ${EndIf}

  ; --- Cleanup ---
  Delete "$TEMP\Prism-Desktop-Setup.exe"

  electron_cleanup:

SectionEnd

LangString DESC_ELECTRON ${LANG_ENGLISH} \
  "Downloads and installs the Prism standalone desktop IDE. Requires an internet connection (~130 MB download)."
