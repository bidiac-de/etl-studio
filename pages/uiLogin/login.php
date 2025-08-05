<?php

    $username = "";
    $showError = false;

    if (isset($_SESSION["username"])) {
        $username = $_SESSION["username"];
    }

?>


<link rel="stylesheet" href="pages/uiLogin/login.css">
<main class="container-fluid" id="loginContainerParent">
    <main class="container" id="loginContainerChild">
        <h1>Login</h1>
        <hr><br>
        <form method="POST">
            <input name="username" placeholder="Username" autocomplete="username" value="<?=$username?>" />
            <input type="password" aria-describedby="password-validationtext" <?=$username==""?"":"aria-invalid='true'"?> name="password" placeholder="Password" autocomplete="current-password" />
            <small id="password-validationtext"><?=$username==""?"":"Wrong password!"?></small>
            <label for="remember">
                <input type="checkbox" role="switch" id="remember" name="remember" />
                Remember me
            </label>
            <br>
            <button id="btnLogin">Log in</button>
        </form>
        <hr>
    </main>
</main>
<script src="pages/uiLogin/login.js"></script>