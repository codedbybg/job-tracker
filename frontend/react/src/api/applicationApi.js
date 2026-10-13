import api from "./axios";

export const getMyApplications = async () => {
    const response = await api.get("/applications/my");
    return response.data;
};

export const withdrawApplication = async (id) => {
    const response = await api.patch(
        `/applications/${id}/withdraw`
    );

    return response.data;
};

export const getApplicantsForJob = async (jobId) => {
    const response = await api.get(`/applications/job/${jobId}`);
    return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
    const response = await api.patch(
        `/applications/${applicationId}/status`,
    { status }
    );

    return response.data;
};