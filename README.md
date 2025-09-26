# ETL Studio

> **A modern, user-friendly web application for creating and managing ETL processes (Extract, Transform, Load)**

[![PHP](https://img.shields.io/badge/PHP-8.0+-blue.svg)](https://php.net/)
[![SQLite](https://img.shields.io/badge/SQLite-3-green.svg)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

## Overview

ETL Studio is an intuitive web-based application that enables you to create and manage complex data processing workflows visually. With a user-friendly drag-and-drop interface, you can easily compose ETL processes without complex programming.

### Key Features

- **Visual Workflow Editor**: Create ETL processes with an intuitive whiteboard interface
- **Database Integration**: Support for MySQL, MongoDB and other data sources
- **File Processing**: Import/export of CSV, JSON and other formats
- **Real-time Execution**: Monitor your jobs in real-time with integrated console
- **Server Management**: Manage multiple execution servers centrally
- **User Management**: Secure login and user administration

## Features

### Visual Job Editor
- **Whiteboard Interface**: Drag-and-drop components for intuitive workflow creation
- **Zoom & Navigation**: Flexible zoom functions and panning for large workflows
- **Component Library**: Pre-built components for common ETL operations

### Available Components
- **Databases**: MySQL, MongoDB
- **Files**: CSV, JSON
- **Transformations**: Filter, Merge
- **Extensible**: Support for custom components

### Server Management
- **Multi-Server Support**: Manage multiple execution servers
- **Connection Validation**: Automatic verification of server connections
- **Security**: Access key-based authentication

### Job Management
- **Job Creation**: Easy creation of new ETL jobs
- **Execution**: Direct execution with live monitoring
- **Console**: Integrated console for debugging and monitoring
- **Versioning**: Job versioning and recovery

## Technology Stack

### Backend
- **PHP 8.0+**: Server-side logic
- **SQLite**: Local database for configuration and metadata
- **Session Management**: Secure user sessions

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Interactive user interface
- **jQuery 3.7.1**: DOM manipulation and AJAX
- **Pico CSS**: Minimalist CSS framework
- **Font Awesome 7.0**: Icon library
- **Devicon**: Icon library
- **Tabler icons**: Icon library
- **Flexbox Grid**: Responsive layout system
- **Codemirror**: Json Editor
- **Drawflow**: Whiteboard

### Architecture
- **MVC Pattern**: Clean separation of logic and presentation
- **Modular Structure**: Reusable components
- **RESTful Design**: API-like URL structure

## Installation

### Prerequisites
- PHP 8.0 or higher
- Web server (Apache, Nginx, or PHP Built-in Server)
- SQLite support
- Write permissions for the project directory

### Step-by-Step Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/etl-studio.git
   cd etl-studio
   ```

2. **Configure Web Server**
   - Apache: Ensure `mod_rewrite` is enabled
   - Nginx: Configure URL rewriting
   - PHP Built-in Server: `php -S localhost:8000`

3. **Set Permissions**
   ```bash
   chmod 755 etl-studio/
   chmod 644 etl-studio/etl.db
   ```

4. **Initial Configuration**
   - Open `http://localhost/etl-studio` in your browser
   - Follow the setup wizard

## Getting Started

### 1. Setup Wizard
On first startup, you'll be guided through the setup wizard:

1. **Configure Database**
   - Set SQLite database path
   - **Security**: Use a path that is not publicly accessible

2. **Create Admin Account**
   - Set username and password
   - Password confirmation

### 2. Create First Job
1. Log in with your admin credentials
2. Click "Add component" → "Create new job"
3. Enter a job name
4. Start with visual workflow design

### 3. Add Server (Optional)
1. Navigate to "Server" in the main menu
2. Click "Add new server"
3. Configure connection parameters
4. Test the connection

## Usage

### Job Creation
1. **Create New Job**: Dashboard → "Create new job"
2. **Add Components**: "Add component" → Select component
3. **Connect Workflow**: Connect components via drag-and-drop
4. **Save Job**: Automatic saving on changes

### Job Execution
1. **Open Job**: Select from job list
2. **Open Console**: Terminal icon for live monitoring
3. **Start Execution**: Press play button
4. **Monitor Progress**: Watch console and progress bar

### Server Management
1. **Add Server**: Server menu → "Add new server"
2. **Test Connection**: Automatic validation
3. **Manage Servers**: Edit, delete, monitor status

## Project Structure

```
etl-studio/
├── inc/                       # PHP includes and configuration
│   ├── config.php            # Main configuration
│   ├── database.php          # Database connection
│   ├── includes.php          # Global includes
│   ├── login.php             # Authentication
│   ├── server.php            # Server logic
│   └── setup.php             # Setup wizard
├── pages/                     # UI pages
│   ├── uiDashboard/          # Main dashboard
│   ├── uiJob/                # Job editor
│   ├── uiLogin/              # Login page
│   ├── uiServer/             # Server management
│   ├── uiSettings/            # Settings
│   └── uiSetup/              # Setup wizard
├── libs/                      # External libraries
│   ├── pico-main/            # CSS framework
│   ├── fontawesome-free-*/   # Icon library
│   ├── flexboxgrid.min.css   # Grid system
│   └── jquery-3.7.1.min.js   # JavaScript framework
├── index.php                  # Main entry point
├── config.json               # Configuration file
├── etl.db                    # SQLite database
└── README.md                 # This file
```

## Development

### Local Development
```
With XAMPP/WAMP
Copy project to htdocs directory
```

### Debugging
- **Browser Console**: Monitor JavaScript errors
- **PHP Logs**: Log server-side errors
- **SQLite Browser**: Inspect database contents

### Advanced Configuration
Edit `inc/config.php` for:
- Timezone adjustment
- Available components
- Database path

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**ETL Studio** - *Creating modern ETL processes simply and visually*