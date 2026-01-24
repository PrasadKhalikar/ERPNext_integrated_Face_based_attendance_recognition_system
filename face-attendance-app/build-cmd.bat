@echo off
REM Build Expo Preview APK - Command Prompt version

echo Clearing proxy settings...
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

echo.
echo Starting EAS Build for Android Preview...
echo.

eas build --platform android --profile preview

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build started successfully!
    echo Check your email or EAS dashboard for build progress.
) else (
    echo.
    echo Build command encountered an issue.
    echo Error code: %ERRORLEVEL%
)
