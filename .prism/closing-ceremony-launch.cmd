@echo off
cd /d "C:\Users\digit\GriotApps\Prism"
"C:\Users\digit\.local\bin\claude.exe" --dangerously-skip-permissions --add-dir "C:\Users\digit\GriotMeta\digital-griot-skills" --add-dir "C:\Users\digit\GriotMeta\griot-ontology" --add-dir "C:\Users\digit\GriotMeta\griot-live-artifacts" -p < ".prism\closing-ceremony-instructions.txt" > ".prism\closing-ceremony-run.log" 2>&1
echo ___LAUNCHER_EXIT_%ERRORLEVEL%___ >> ".prism\closing-ceremony-run.log"
