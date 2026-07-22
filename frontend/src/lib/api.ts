import axios from "axios";

// ──── Create Base Axios Instances ────

export const apiIdentity = axios.create({
  baseURL: "http://localhost:4001/api/auth",
});

export const apiFleet = axios.create({
  baseURL: "http://localhost:4003/api/fleet",
});

export const apiOrder = axios.create({
  baseURL: "http://localhost:4004/api/orders",
});

export const apiDispatch = axios.create({
  baseURL: "http://localhost:4005/api/dispatch",
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
