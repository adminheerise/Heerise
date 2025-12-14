@echo off
setlocal enabledelayedexpansion

REM HeeRise 一键设置 Admin（双击运行）
REM 用法：双击本文件，按提示输入邮箱

pushd %~dp0\..

echo ==========================================
echo HeeRise - Set User Role to ADMIN (DEV)
echo Database: backend\app.db  (or DATABASE_URL sqlite)
echo ==========================================
echo.

set /p EMAIL=Enter the user email to promote to ADMIN (e.g. zzb@163.com):

if "%EMAIL%"=="" (
  echo [ERROR] No email provided. Exiting.
  pause
  exit /b 2
)

REM 优先使用虚拟环境 python
set PY=%CD%\.venv\Scripts\python.exe
if exist "%PY%" (
  "%PY%" scripts\make_admin.py --email "%EMAIL%"
) else (
  python scripts\make_admin.py --email "%EMAIL%"
)

echo.
echo If you see "Updated OK" or "Already admin", it's done.
echo Then refresh the frontend (or re-login) and open /admin.
echo.
pause

popd
endlocal


