@echo off
if exist env-templates\railway-cli.env (
  for /f "usebackq tokens=1,* delims==" %%a in ("env-templates\railway-cli.env") do (
    if /i "%%a"=="RAILWAY_TOKEN" set RAILWAY_TOKEN=%%b
  )
)
if not defined RAILWAY_TOKEN (
  echo RAILWAY_TOKEN not set. Run: railway login
  echo Or save token to env-templates\railway-cli.env
  exit /b 1
)
railway whoami
if errorlevel 1 exit /b 1
powershell -ExecutionPolicy Bypass -File scripts\railway-marketing-deploy.ps1
