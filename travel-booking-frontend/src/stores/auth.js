import authService from "../services/auth.service";

export const storeLogin = async (email, password) => {
  try {
    const response = await authService.login({
      email,
      password,
    });

    const data = response.data;

    if (!data.success) {
      return {
        success: false,
        message: data.message || "Đăng nhập thất bại",
      };
    }

    localStorage.setItem("accessToken", data.token);

    return data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Đăng nhập thất bại",
    };
  }
};
export const getCurrentUser = async () => {
  try {
    const response = await authService.getMe();
    const roleResponse = await authService.userRole();

    const data = {
      ...response.data.data,
      ...roleResponse.data.data,
    };

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const logOut = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

export const registerStore = async (data) => {
  try {
    const response = await authService.register(data);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const changePasswordStore = async (data) => {
  try {
    const response = await authService.changePassword(data);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
