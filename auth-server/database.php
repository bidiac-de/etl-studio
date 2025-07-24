<?php

class AuthDatabase {
    private $db;
    
    public function __construct() {
        $this->db = new SQLite3('users.db');
        $this->initDatabase();
    }
    
    private function initDatabase() {
        $this->db->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            fullname TEXT,
            role TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )');
    }
    
    public function getUser($username) {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = :username');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $result = $stmt->execute();
        return $result->fetchArray(SQLITE3_ASSOC);
    }
    
    public function verifyUser($username, $password) {
        $user = $this->getUser($username);
        if ($user && password_verify($password, $user['password'])) {
            return $user;
        }
        return false;
    }
    
    public function addUser($username, $password, $fullname, $role = 'user') {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->db->prepare('INSERT INTO users (username, password, fullname, role) VALUES (:username, :password, :fullname, :role)');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
        $stmt->bindValue(':fullname', $fullname, SQLITE3_TEXT);
        $stmt->bindValue(':role', $role, SQLITE3_TEXT);
        return $stmt->execute();
    }
    
    public function updateUser($username, $data) {
        $sql = 'UPDATE users SET ';
        $params = [];
        foreach ($data as $key => $value) {
            if ($key !== 'id' && $key !== 'username') {
                $params[] = "$key = :$key";
            }
        }
        $sql .= implode(', ', $params) . ' WHERE username = :username';
        
        $stmt = $this->db->prepare($sql);
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $stmt->bindValue(":$key", $value, SQLITE3_TEXT);
            }
        }
        return $stmt->execute();
    }
    
    public function deleteUser($username) {
        $stmt = $this->db->prepare('DELETE FROM users WHERE username = :username');
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);
        return $stmt->execute();
    }
    
    public function getAllUsers() {
        $result = $this->db->query('SELECT id, username, fullname, role, created_at FROM users ORDER BY username');
        $users = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $users[] = $row;
        }
        return $users;
    }
    
    public function hasUsers() {
        $result = $this->db->query('SELECT COUNT(*) as count FROM users');
        $count = $result->fetchArray()['count'];
        return $count > 0;
    }
}

?> 