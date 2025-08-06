<link rel="stylesheet" href="pages/uiSettings/settings.css">

<header class="container-fluid">
    <div class="grid">
        <div>
            <button class="outline secondary" data-tooltip="Back" data-placement="bottom" style="float: left; margin-right: 20px;" onclick="window.location.href='./'">
                <i class="fa-solid fa-arrow-left-long"></i>
            </button>
            <h2>Settings</h2>
        </div>
        <div style="text-align: right;">
            <input type="search" name="search" placeholder="Search" aria-label="Search" style="width: 50%; margin-right: 10px;"/>
        </div>
    </div>
</header>

<br><br>
<main class="container">
    <section>
        <h3>User Interface</h3>
        <hr>
        <fieldset class="grid settingsFieldset">
            <label for="darktheme">Dark theme</label>
            <input name="darktheme" type="checkbox" role="switch" id="darktheme"/>
        </fieldset>
        <fieldset class="grid settingsFieldset">
            <label for="consoleBufferSize">Console Buffer Size</label>
            <input type="number" id="consoleBufferSize" value="10000" min="1" max="10000000" step="1">
        </fieldset>
    </section>

    <section>
        <h3>System</h3>
        <hr>
    </section>

     <section>
        <h3>Updates</h3>
        <hr>
    </section>


    

</main>

<script src="pages/uiSettings/settings.js"></script>