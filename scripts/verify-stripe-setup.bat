@echo off
REM Stripe Production Setup Verification Script (Windows)
REM Verifies that all Stripe LIVE configuration is correct

echo ==========================================
echo Stripe Production Setup Verification
echo ==========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Enable delayed expansion for variables in loops
setlocal enabledelayedexpansion

REM Check environment variables
echo Checking Environment Variables...
echo ----------------------------------------

REM Check Railway API variables
echo Railway (API Service):
if "%STRIPE_SECRET_KEY%"=="" (
    echo [FAIL] STRIPE_SECRET_KEY not set
    set /a ERRORS+=1
) else (
    echo %STRIPE_SECRET_KEY% | findstr /R "^sk_live_" >nul
    if errorlevel 1 (
        echo [FAIL] STRIPE_SECRET_KEY is not a LIVE key (should start with sk_live_)
        set /a ERRORS+=1
    ) else (
        echo [OK] STRIPE_SECRET_KEY is LIVE key
    )
)

if "%STRIPE_PUBLISHABLE_KEY%"=="" (
    echo [FAIL] STRIPE_PUBLISHABLE_KEY not set
    set /a ERRORS+=1
) else (
    echo %STRIPE_PUBLISHABLE_KEY% | findstr /R "^pk_live_" >nul
    if errorlevel 1 (
        echo [FAIL] STRIPE_PUBLISHABLE_KEY is not a LIVE key (should start with pk_live_)
        set /a ERRORS+=1
    ) else (
        echo [OK] STRIPE_PUBLISHABLE_KEY is LIVE key
    )
)

if "%STRIPE_WEBHOOK_SECRET%"=="" (
    echo [FAIL] STRIPE_WEBHOOK_SECRET not set
    set /a ERRORS+=1
) else (
    echo %STRIPE_WEBHOOK_SECRET% | findstr /R "^whsec_" >nul
    if errorlevel 1 (
        echo [FAIL] STRIPE_WEBHOOK_SECRET format incorrect (should start with whsec_)
        set /a ERRORS+=1
    ) else (
        echo [OK] STRIPE_WEBHOOK_SECRET is set
    )
)

echo.

REM Check product/price IDs
echo Stripe Product/Price IDs:
for %%P in (A B C D) do (
    call :check_package %%P
)

echo.

REM Summary
echo ==========================================
if %ERRORS%==0 (
    echo [OK] All critical checks passed!
    if %WARNINGS% GTR 0 (
        echo [WARN] %WARNINGS% warning(s)
    )
    echo.
    echo Next steps:
    echo 1. Verify products in Stripe Dashboard
    echo 2. Test webhook endpoint
    echo 3. Create test subscription
    echo 4. Run seed script: npm run db:seed
    endlocal
    exit /b 0
) else (
    echo [FAIL] %ERRORS% error(s) found
    if %WARNINGS% GTR 0 (
        echo [WARN] %WARNINGS% warning(s)
    )
    echo.
    echo Please fix errors before proceeding with production setup.
    endlocal
    exit /b 1
)

:check_package
set PACKAGE=%1
set PRODUCT_VAR=STRIPE_PRODUCT_PACKAGE_%PACKAGE%
set PRICE_VAR=STRIPE_PRICE_PACKAGE_%PACKAGE%_MONTHLY

call set PRODUCT_ID=%%%PRODUCT_VAR%%
call set PRICE_ID=%%%PRICE_VAR%%

if "!PRODUCT_ID!"=="" (
    echo [FAIL] %PRODUCT_VAR% not set
    set /a ERRORS+=1
) else (
    echo !PRODUCT_ID! | findstr /R "^prod_" >nul
    if errorlevel 1 (
        echo [FAIL] %PRODUCT_VAR% format incorrect (should start with prod_)
        set /a ERRORS+=1
    ) else (
        echo [OK] %PRODUCT_VAR% is set
    )
)

if "!PRICE_ID!"=="" (
    echo [FAIL] %PRICE_VAR% not set
    set /a ERRORS+=1
) else (
    echo !PRICE_ID! | findstr /R "^price_" >nul
    if errorlevel 1 (
        echo [FAIL] %PRICE_VAR% format incorrect (should start with price_)
        set /a ERRORS+=1
    ) else (
        echo [OK] %PRICE_VAR% is set
    )
)
goto :eof
