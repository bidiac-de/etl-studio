@echo off
echo Checking for initial admin setup...

REM Prüfe ob User existieren, falls nicht Setup ausführen
php -r "require_once('database.php'); $db = new AuthDatabase(); if(!$db->hasUsers()) { echo 'No users found. Running setup...' . PHP_EOL; include('init-admin.php'); } else { echo 'Users found. Skipping setup.' . PHP_EOL; }"

echo Starting Auth Server on localhost:9000
php -S localhost:9000 router.php
pause 