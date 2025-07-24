document.querySelector("form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;
    if (!username) {
        document.querySelector("input[name='username']").setAttribute("aria-invalid", "true");
        return;
    }
    if (!password) {
        document.querySelector("input[name='password']").setAttribute("aria-invalid", "true");
        return;
    }
    document.getElementById("btnLogin").setAttribute("aria-busy", "true");
    
    try {
        const res = await fetch("http://localhost:9000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));
            
            try {
                const sessionRes = await fetch("/index.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&auth_success=true&fullname=${encodeURIComponent(data.user.fullname)}`
                });
                if (sessionRes.ok) {
                    window.location.href = "/";
                } else {
                    alert("Session konnte nicht gesetzt werden");
                }
            } catch (sessionErr) {
                alert("Session konnte nicht gesetzt werden");
            }
        } else {
            alert("Login fehlgeschlagen: " + (data.message || "Unbekannter Fehler"));
        }
    } catch (err) {
        alert("Auth-Server nicht erreichbar");
    } finally {
        document.getElementById("btnLogin").removeAttribute("aria-busy");
    }
});