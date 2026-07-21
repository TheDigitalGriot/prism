; =============================================================================
; DEPRECATED — This NSIS installer is superseded by the Tauri installer
; at apps/prism-installer/. Kept for reference and rollback purposes.
; See: .prism/shared/plans/2026-03-05-unified-tauri-installer.md
; =============================================================================

; =============================================================================
;  Prism Setup — Native NSIS Installer
;  Version: ${VERSION} (passed via makensis -DVERSION=x.y.z)
;
;  Installs: Prism CLI, VSCode Extension, Claude Plugin, Desktop App
;  Plugins:  EnVar (PATH), NScurl (downloads), nsExec, NsDialogs
; =============================================================================

Unicode True
SetCompressor /SOLID lzma

; Add local plugins directory for EnVar and NScurl
!addplugindir /x86-unicode "plugins\x86-unicode"

; ---------------------------------------------------------------------------
;  Build-time defines
; ---------------------------------------------------------------------------

!ifndef VERSION
  !define VERSION "0.0.0"
!endif

!ifndef RESOURCES_DIR
  !define RESOURCES_DIR "..\apps\prism-setup\resources"
!endif

!define PRODUCT_NAME      "Prism"
!define PRODUCT_PUBLISHER  "Digital Griot Studio"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; ---------------------------------------------------------------------------
;  Includes
; ---------------------------------------------------------------------------

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "Sections.nsh"
!include "nsDialogs.nsh"
!include "WordFunc.nsh"

; ---------------------------------------------------------------------------
;  Installer attributes
; ---------------------------------------------------------------------------

Name              "${PRODUCT_NAME} ${VERSION}"
OutFile           "Prism-Setup-${VERSION}.exe"
InstallDir        "$LOCALAPPDATA\Prism"
InstallDirRegKey  HKCU "Software\Prism" "InstallDir"
RequestExecutionLevel user
BrandingText      "${PRODUCT_NAME} v${VERSION}"

; ---------------------------------------------------------------------------
;  MUI2 interface settings
; ---------------------------------------------------------------------------

!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_SMALLDESC

; Welcome page text
!define MUI_WELCOMEPAGE_TITLE "Welcome to Prism Setup"
!define MUI_WELCOMEPAGE_TEXT \
  "This wizard will install the Prism development ecosystem on your computer.$\r$\n$\r$\n\
  Components:$\r$\n\
  $\t- Prism CLI dashboard$\r$\n\
  $\t- VSCode / Cursor / Windsurf extension$\r$\n\
  $\t- Claude Code plugin$\r$\n\
  $\t- Prism Desktop App (optional)$\r$\n$\r$\n\
  Click Next to continue."

; Finish page
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT \
  "Prism has been installed on your computer.$\r$\n$\r$\n\
  Open a new terminal window and run:$\r$\n\
  $\t$\"prism-cli$\"$\r$\n$\r$\n\
  to launch the Prism dashboard."
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Open a new terminal"
!define MUI_FINISHPAGE_RUN_FUNCTION OpenNewTerminal
!define MUI_FINISHPAGE_LINK "Prism on GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/TheDigitalGriot/prism"

; ---------------------------------------------------------------------------
;  Pages
; ---------------------------------------------------------------------------

; Installer pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
Page custom PreflightPageCreate PreflightPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; ---------------------------------------------------------------------------
;  Language
; ---------------------------------------------------------------------------

!insertmacro MUI_LANGUAGE "English"

; ---------------------------------------------------------------------------
;  Sections (from included .nsh files)
; ---------------------------------------------------------------------------

!include "sections\cli.nsh"
!include "sections\vscode.nsh"
!include "sections\plugin.nsh"
!include "sections\electron.nsh"

; ---------------------------------------------------------------------------
;  Post-install finalization (always runs after all sections)
; ---------------------------------------------------------------------------

Section -Post
  Call WriteUninstallEntry
SectionEnd

; ---------------------------------------------------------------------------
;  Section descriptions (tooltips on Components page)
; ---------------------------------------------------------------------------

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_CLI}      $(DESC_CLI)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_VSCODE}   $(DESC_VSCODE)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_PLUGIN}   $(DESC_PLUGIN)
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC_ELECTRON} $(DESC_ELECTRON)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; ---------------------------------------------------------------------------
;  Custom page and uninstaller includes
; ---------------------------------------------------------------------------

!include "pages\preflight.nsh"
!include "uninstall.nsh"

; ---------------------------------------------------------------------------
;  Callback functions
; ---------------------------------------------------------------------------

Function .onInit
  ; Nothing special needed — sections handle their own defaults
FunctionEnd

Function .onSelChange
  ; Keep CLI section always selected (enforce SectionIn RO)
  !insertmacro SelectSection ${SEC_CLI}
FunctionEnd

Function OpenNewTerminal
  Exec '"$WINDIR\system32\cmd.exe"'
FunctionEnd
