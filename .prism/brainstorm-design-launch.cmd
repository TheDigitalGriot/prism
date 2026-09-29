@echo off
cd /d "C:\Users\digit\GriotApps\Prism"
"C:\Users\digit\.local\bin\claude.exe" --dangerously-skip-permissions -p < ".prism\brainstorm-design-instructions.txt" > ".prism\brainstorm-design-run.log" 2>&1
echo ___LAUNCHER_EXIT_%ERRORLEVEL%___ >> ".prism\brainstorm-design-run.log"
