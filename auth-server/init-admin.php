<?php
require_once('database.php');

function prompt($text) {
    echo $text;
    return trim(fgets(STDIN));
}

$db = new AuthDatabase();
$users = $db->getAllUsers();

if (count($users) > 0) {
    echo "Es existieren bereits Benutzer. Initiales Setup nicht nötig.\n";
    exit(0);
}

// Admin-Daten abfragen
$username = prompt("Admin-Benutzername: ");
while (empty($username)) {
    $username = prompt("Benutzername darf nicht leer sein. Nochmal: ");
}
$password = prompt("Admin-Passwort: ");
while (empty($password)) {
    $password = prompt("Passwort darf nicht leer sein. Nochmal: ");
}
$fullname = prompt("Admin-Name (z.B. Max Mustermann): ");
while (empty($fullname)) {
    $fullname = prompt("Name darf nicht leer sein. Nochmal: ");
}

$db->addUser($username, $password, $fullname, 'admin');
echo "Admin-User erfolgreich angelegt!\n"; 