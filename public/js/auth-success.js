try {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  console.log("Running auth script...");

  if (token) {
    console.log("Token received:", token);

    localStorage.setItem("token", token);

    window.location.href = "/";
  } else {
    document.body.innerHTML = "<h2>No token found</h2>";
  }
} catch (err) {
  console.error("Error:", err);
  document.body.innerHTML = "<h2>Error occurred</h2>";
}