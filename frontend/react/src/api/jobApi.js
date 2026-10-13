import api from "./axios";

// Fetch jobs from the backend
export const getJobs = async (params = {})=>{
    const response = await api.get("/jobs" , {params});

    return response.data;
};

// Fetch One Job By Id
export const getJobById = async (id)=>{
    const response = await api.get(`/jobs/${id}`);

    return response.data
}

// Get jobs posted by the logged-in recruiter
export const getMyJobs = async () => {
  const response = await api.get("/jobs/my-jobs");
  return response.data;
};