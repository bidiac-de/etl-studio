<link rel="stylesheet" href="pages/uiLogin/login.css">
<main class="container-fluid" id="loginContainerParent">
    <main class="container" id="loginContainerChild">
        <h1>Login</h1>
        <hr><br>
        <form method="POST">
            <input name="username" placeholder="Username" autocomplete="username" />
            <input type="password" name="password" placeholder="Password" autocomplete="current-password" />
            <label for="remember">
                <input type="checkbox" role="switch" id="remember" name="remember" />
                Remember me
            </label>
            <br>
            <button id="btnLogin">Log in</button>
            <!--<input type="submit" value="Log in" />-->
        </form>
        <hr>
    </main>
</main>
<script src="pages/uiLogin/login.js"></script>