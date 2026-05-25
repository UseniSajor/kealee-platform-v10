@echo off
if exist env-templates\railway-cli.env (
  for /f "usebackq tokens=1,* delims==" %%a in ("env-templates\railway-cli.env") do (
    if /i "%%a"=="RAILWAY_TOKEN" set RAILWAY_TOKEN=%%b
  )
)
if not defined RAILWAY_TOKEN set RAILWAY_TOKEN=cd78d6fe-082e-4968-8058-d1cb7a5bca58
railway whoami
echo EXIT_CODE=%ERRORLEVEL%
