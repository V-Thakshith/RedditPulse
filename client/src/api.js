const BASE_URL = "http://localhost:5000/api";
function getAuthHeaders() {
  const user = JSON.parse(localStorage.getItem("user"));
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };
}


export async function fetchAnalysis() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user?.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch("http://localhost:5000/api/analysis/latest", {
    headers: getAuthHeaders(),
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

export async function getWatchlist() {
  const res=await fetch(`${BASE_URL}/user/watchlist`,{
    headers: getAuthHeaders(),

  });
  return res.json();
}

export async function addToWatchlist(ticker){
  const res=await fetch(`${BASE_URL}/user/watchlist`,{
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ticker})
  });
  return res.json();
}

export async function removeFromWatchlist(ticker){
const res=await fetch(`${BASE_URL}/user/watchlist/${ticker}`,{
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function getWatchlistInsights() {
  const user = JSON.parse(localStorage.getItem("user"));

  const res = await fetch(
    `${BASE_URL}/user/watchlist/insights`,
    {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    }
  );

  return res.json();
}


export async function getHistory(ticker) {
  const user = JSON.parse(localStorage.getItem("user"));

  const res = await fetch(
    `${BASE_URL}/analysis/history/${ticker}`,
    {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    }
  );

  return res.json();
}