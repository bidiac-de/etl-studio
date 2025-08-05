<link rel="stylesheet" href="pages/uiSetup/setup.css">

<main class="container" id="setupContainerChild">
    <h1><i class="fa-solid fa-screwdriver-wrench" style="margin-right: 10px;"></i> Setup</h1>
    <hr>
    <form method="POST">
        <section>
            <h3><i class="fa-solid fa-database" style="margin-right: 5px;"></i> Database</h3>
            <fieldset class="grid setupFieldset">
                <div><label for="sqlitefilepath">Sqlite filepath</label></div>
                <div>
                    <input name="sqlitefilepath" aria-describedby="sqlitefilepath-validationtext" id="sqlitefilepath" placeholder="e.g. /var/www/sqlite/etl.db" />
                    <small id="sqlitefilepath-validationtext"></small>
                </div>
            </fieldset>
            
            <span><i class="fa-solid fa-triangle-exclamation pico-color-pumpkin-300"></i></span>
            <small style="margin-top: 5px; margin-left: 5px;">Do not use a path that is accessible from the internet or secure it additionally with a directory protection like .htaccess!</small>
        </section>
        <hr>
        <section>
            <h3><i class="fa-solid fa-user-shield" style="margin-right: 5px;"></i> Admin Account</h3>
            <fieldset class="grid setupFieldset">
                <div>
                    <label for="username">Username</label>
                </div>
                <div>
                    <input name="username" id="username" placeholder="admin" aria-describedby="username-validationtext"/>
                    <small id="username-validationtext"></small>
                </div>
                
            </fieldset>
            <fieldset class="grid setupFieldset">
                <div>
                    <label for="password">Password</label>
                </div>
                <div>
                    <input name="password" id="password" type="password" aria-describedby="password-validationtext"/>
                    <small id="password-validationtext"></small>
                </div>
            </fieldset>
            <fieldset class="grid setupFieldset">
                <div>
                    <label for="passwordRepeat">Repeat Password</label>
                </div>
                <div>
                    <input name="passwordRepeat" id="passwordRepeat" type="password" aria-describedby="passwordRepeat-validationtext" />
                    <small id="passwordRepeat-validationtext"></small>
                </div>
            </fieldset>
        </section>
        <hr>
        <section>
            <h3><i class="fa-solid fa-server" style="margin-right: 5px;"></i> Execution Server (optional)</h3>
            <fieldset class="grid setupFieldset">
                <div>
                    <label for="host">URL</label>
                </div>
                <div>
                    <input name="host" id="host" aria-describedby="host-validationtext" />
                    <small id="host-validationtext"></small>
                </div>
            </fieldset>
            <fieldset class="grid setupFieldset">
                <div>
                    <label for="key">Access Key</label>
                </div>
                <div>
                    <input name="key" id="key" aria-describedby="key-validationtext"/>
                    <small id="key-validationtext"></small>
                </div>
            </fieldset>
        </section>
        <hr>
    </form>
    <br>
    <button id="btnNext">Finish <i class="fa-solid fa-flag-checkered"></i></button>
</main>
<script src="pages/uiSetup/setup.js"></script>