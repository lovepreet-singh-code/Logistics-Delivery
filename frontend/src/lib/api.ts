import axios from "axios";

// ──── Create Base Axios Instances ────

export const apiIdentity = axios.create({
  baseURL: "http://localhost:8080/api/auth",
});

export const apiFleet = axios.create({
  baseURL: "http://localhost:8080/api/fleet",
});

export const apiOrder = axios.create({
  baseURL: "http://localhost:8080/api/orders",
});

export const apiDispatch = axios.create({
  baseURL: "http://localhost:8080/api/dispatch",
});

// ──── JWT Interceptor ────

const attachToken = (config: any) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

apiIdentity.interceptors.request.use(attachToken);
apiFleet.interceptors.request.use(attachToken);
apiOrder.interceptors.request.use(attachToken);
apiDispatch.interceptors.request.use(attachToken);
