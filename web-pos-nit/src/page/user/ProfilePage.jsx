
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Upload, message, Card, Row, Col, Modal } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { request } from "../../util/helper";
import { Config } from "../../util/config";
import { getProfile, setProfile } from "../../store/profile.store";
import "./ProfilePage.module.css";

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [profile, setProfileState] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const navigate = useNavigate();
  const currentUser = getProfile();
  const [imageDefault, setImageDefault] = useState([]);

  // Fetch user profile data
  const fetchProfile = async () => {
    if (!currentUser || !currentUser.id) {
      message.error("User not found, redirecting to login");
      navigate("/login");
      return;
    }

    try {
      const res = await request(`auth/user-profile/${currentUser.id}`, "get");
      if (res && !res.error) {
        setProfileState(res.profile);
        form.setFieldsValue({
          name: res.profile.name,
          username: res.profile.username,
        });

        // Set the profile image if it exists
        if (res.profile.profile_image) {
          const imageUrl = Config.getFullImagePath(res.profile.profile_image);
          setImageUrl(imageUrl);
          setImageDefault([
            {
              uid: "-1",
              name: res.profile.profile_image,
              status: "done",
              url: imageUrl,
            },
          ]);
        } else {
          setImageDefault([]); // Clear the image if no profile image exists
        }
      }
    } catch (error) {
      message.error("Error retrieving profile information");
      console.error("Error fetching profile:", error);
    }
  };

  // Only run once when component mounts
  useEffect(() => {
    fetchProfile();
  }, []); // Empty dependency array to run only once

  // Handle form submission
  const onFinish = async (values) => {
    if (!currentUser || !currentUser.id) {
      message.error("User information is missing");
      return;
    }
  
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("username", values.username.trim());
  
      if (values.password) {
        formData.append("password", values.password);
      }
  
      // Append the file if it exists - use "upload_image" to match backend
      if (values.profile_image && values.profile_image.file) {
        formData.append("upload_image", values.profile_image.file.originFileObj);
      }
  
      // Send the request to the backend
      const res = await request(`user/profile/${currentUser.id}`, "put", formData);
  
      if (res && res.success) {
        message.success("Profile updated successfully!");
  
        // Clear the form cache for the image
        form.setFieldsValue({
          profile_image: null
        });
  
        // Update locally stored profile with the returned profile data
        if (res.profile) {
          setProfile({
            ...currentUser,
            name: res.profile.name,
            username: res.profile.username,
            profile_image: res.profile.profile_image
          });
        }
  
        // Refresh profile to get updated data including the new image
        setTimeout(() => {
          fetchProfile();
          navigate("/login");
        }, 300);
      } else {
        message.error(res.message || "Failed to update profile");
      }
    } catch (error) {
      message.error("Failed to update profile. Please try again.");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  // Convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle image upload changes
  const handleChangeImageDefault = ({ fileList: newFileList }) => {
    setImageDefault(newFileList);

    // Update the form state with the new file
    if (newFileList.length > 0) {
      form.setFieldsValue({
        profile_image: { file: newFileList[0] },
      });
    } else {
      form.setFieldsValue({
        profile_image: null,
      });
    }
  };

  return (
    <div className="profile-page">
      <Card
        title="Profile Settings"
        bordered={false}
        style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}
      >
        <Row gutter={[24, 24]}>
         
          <Col xs={24} md={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                name: profile?.name || "",
                username: profile?.username || "",
              }}
            >
               <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Form.Item
              name="profile_image"
              label={
                <div style={{ textAlign: "center" }}>
                  <span className="khmer-text">រូបភាព</span>
                  <br />
                  <span className="english-text">Profile Image</span>
                </div>
              }
            >
              <Upload
                name="upload_image" // Ensure this matches the backend field name
                accept="image/*"
                customRequest={(options) => {
                  setTimeout(() => {
                    options.onSuccess("ok");
                  }, 0);
                }}
                maxCount={1}
                listType="picture-card"
                fileList={imageDefault}
                onPreview={handlePreview}
                onChange={handleChangeImageDefault}
              >
                {imageDefault.length >= 1 ? null : (
                  <div>
                    <UserOutlined style={{ fontSize: 40, color: "#aaa" }} />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter your name!" },
                ]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>

              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please enter your username!" },
                ]}
              >
                <Input placeholder="Enter your username" />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="password"
                rules={[
                  { min: 6, message: "Password must be at least 6 characters!" },
                ]}
              >
                <Input.Password placeholder="Enter new password (leave blank to keep current)" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!getFieldValue("password") || !value) {
                        return Promise.resolve();
                      }
                      if (getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Passwords do not match!");
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{ width: "100%" }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>

      {/* Image Preview Modal */}
      <Modal open={previewOpen} title="Image Preview" footer={null} onCancel={() => setPreviewOpen(false)}>
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProfilePage;