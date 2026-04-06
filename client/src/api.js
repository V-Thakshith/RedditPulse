const BASE_URL = "http://localhost:5000/api";



export async function fetchAnalysis() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user?.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch("http://localhost:5000/api/analysis/latest", {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("user");
    window.location.reload();
    return;
  }

  return res.json();
}
export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

// ✅ SIGNUP
export async function signupUser(data) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}