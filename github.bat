@echo off
set /p BRANCH="Nhap ten branch: "

git checkout -b %BRANCH%
git add .
git commit -m "auto commit for %BRANCH%"
git push origin %BRANCH%

echo =============================
echo   DONE!
echo Branch %BRANCH% da duoc push
echo =============================
pause