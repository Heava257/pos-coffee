import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import { request } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import "./Product.css"
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
function ProductPage() {
  const { config } = configStore();
  const [form] = Form.useForm();
  const [state, setState] = useState({
    list: [],
    visibleModal: false,
  });
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [imageDefault, setImageDefault] = useState([]);
  const [imageOptional, setImageOptional] = useState([]);

  useEffect(() => {
    getList();
  }, []);
  const refPage = React.useRef(1);

  const getList = async () => {
    var param = {
      ...filter,
      page: 1, // Force first page
      is_list_all: 1, // Ensure fetching all
    };

    setState((pre) => ({ ...pre, loading: true }));
    const { id } = getProfile();
    if (!id) {
      return;
    }
    const res = await request(`product/${id}`, "get", param);
    if (res && !res.error) {
      // Calculate totals for each product category
      const totals = res.list.reduce((acc, item) => {
        if (!acc[item.category_name]) {
          acc[item.category_name] = 0;
        }
        acc[item.category_name] += item.qty;
        return acc;
      }, {});

      setState((pre) => ({
        ...pre,
        list: res.list,
        total: refPage.current == 1 ? res.total : pre.total,
        loading: false,
        totals, // Store totals in state
      }));
    }
  };
  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    setImageDefault([]);
    form.resetFields();
  };
  const onFinish = async (items) => {
    const barcode = form.getFieldValue("barcode");
    const resCheck = await request(`check-barcode/${barcode}`, "get");

    if (resCheck && resCheck.exists && !form.getFieldValue("id")) {
      message.error("This barcode already exists. Please generate a new one.");
      return;
    }

    var params = new FormData();
    params.append("name", items.name);
    params.append("category_id", items.category_id);
    params.append("barcode", items.barcode);
    params.append("brand", items.brand);
    params.append("description", items.description);
    params.append("qty", items.qty);
    params.append("price", items.price);
    params.append("discount", items.discount);
    params.append("status", items.status);
    params.append("image", form.getFieldValue("image"));
    params.append("id", form.getFieldValue("id"));
    params.append("sizes", JSON.stringify(items.sizes || []));
    params.append("addons", JSON.stringify(items.addons || []));


    if (items.image_default) {
      if (items.image_default.file.status === "removed") {
        params.append("image_remove", "1");
      } else {
        params.append(
          "upload_image",
          items.image_default.file.originFileObj,
          items.image_default.file.name
        );
      }
    }
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    const res = await request("product", method, params);
    if (res && !res.error) {
      message.success(res.message);
      onCloseModal();
      getList();
    } else {
      res.error?.barcode && message.error(res.error?.barcode);
    }
  };
  const onBtnNew = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      // Check if this barcode already exists
      const checkRes = await request(`check-barcode/${res.barcode}`, "get");
      if (checkRes && checkRes.exists) {
        // If exists, try again
        return onBtnNew();
      }
      form.setFieldValue("barcode", res.barcode);
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
    }
  };
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  const handleChangeImageDefault = ({ fileList: newFileList }) =>
    setImageDefault(newFileList);
  const handleChangeImageOptional = ({ fileList: newFileList }) =>
    setImageOptional(newFileList);
  const onFilter = () => {
    getList();
  };

  const SAMPLE_SIZES = [
    { label: "Small (S)", value: "S" },
    { label: "Medium (M)", value: "M" },
    { label: "Large (L)", value: "L" },
  ];

  const SAMPLE_ADDONS = [
    { label: "Milk Foam", value: "Milk Foam" },
    { label: "Whipped Cream", value: "Whipped Cream" },
    { label: "Chocolate Syrup", value: "Chocolate Syrup" },
    { label: "Extra Shot", value: "Extra Shot" },
  ];


  const onClickEdit = (item, index) => {
    form.setFieldsValue({
      ...item,
    });
    setState((pre) => ({ ...pre, visibleModal: true }));
    if (item.image != "" && item.image != null) {
      const imageProduct = [
        {
          uid: "-1",
          name: item.image,
          status: "done",
          url: Config.getFullImagePath(item.image),

        },
      ];
      setImageDefault(imageProduct);
    }
  };
  const onClickDelete = (item, index) => {
    Modal.confirm({
      title: "Remove data",
      content: "Are you to remove this porduct?",
      onOk: async () => {
        const res = await request("product", "delete", item);
        if (res && !res.error) {
          message.success(res.message);
          getList();
        }
      },
    });
  };
  return (
    <MainPage loading={false}>
      <div className="pageHeader">
        <Space>
          <div>Product</div>
          <Input.Search
            onChange={(event) =>
              setFilter((p) => ({ ...p, txt_search: event.target.value }))
            }
            allowClear
            placeholder="Search"
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder="Category"
            options={config.category}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, category_id: id }));
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder="Brand"
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />
          <Button onClick={onFilter} type="primary">
            Filter
          </Button>
        </Space>
        <Button type="primary" onClick={onBtnNew}>
          NEW
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? "Edit Product" : "New Product"}
        footer={null}
        onCancel={onCloseModal}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
      >

<Form layout="vertical" onFinish={onFinish} form={form}>
  <Row gutter={16}>
    <Col span={12}>
      <div className="form-section">
        <Form.Item
          name={"name"}
          label="Product Name"
          rules={[{ required: true, message: "Please enter product name" }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        {state.selectedParentId === 51 && (
          <>
            <Form.List name="sizes">
              {(fields, { add, remove }) => (
                <>
                  <h3>Sizes</h3>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="start">
                      <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]}>
                        <Select options={SAMPLE_SIZES} placeholder="Choose Size" style={{ width: 120 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price required' }]}>
                        <InputNumber placeholder="Price" />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)}>Delete</Button>
                    </Space>
                  ))}
                  <Button type="link" onClick={() => add()} icon={<MdAdd />}>Add Size</Button>
                </>
              )}
            </Form.List>

            <Form.List name="addons">
              {(fields, { add, remove }) => (
                <>
                  <h3>Add-ons</h3>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="start">
                      <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]}>
                        <Select options={SAMPLE_ADDONS} placeholder="Choose Add-on" style={{ width: 180 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price required' }]}>
                        <InputNumber placeholder="Price" />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)}>Delete</Button>
                    </Space>
                  ))}
                  <Button type="link" onClick={() => add()} icon={<MdAdd />}>Add Add-on</Button>
                </>
              )}
            </Form.List>
          </>
        )}

        <Form.Item name={"barcode"} label="Barcode">
          <Input disabled placeholder="Barcode" />
        </Form.Item>

        {/* Always show Quantity field */}
        <Form.Item name={"qty"} label="Quantity">
          <InputNumber placeholder="Quantity" style={{ width: "100%" }} />
        </Form.Item>

        {/* Show Discount for all categories except Rice (55) */}
        {state.selectedParentId !== 55 && (
          <Form.Item name={"discount"} label="Discount">
            <InputNumber placeholder="Discount" style={{ width: "100%" }} />
          </Form.Item>
        )}
      </div>
    </Col>

    <Col span={12}>
      <div className="form-section">
        <Form.Item
          name={"category_id"}
          label="Category"
          rules={[{ required: true, message: "Please select category" }]}
        >
          <Select
            options={[
              { label: "🍽️ All", value: "all" },
              { label: "☕ Coffee", value: 51 },
              { label: "🧃 Juice", value: 52 },
              { label: "🥛 Milk Based", value: 53 },
              { label: "🍪 Snack", value: 54 },
              { label: "🍚 Rice", value: 55 },
              { label: "🍰 Dessert", value: 56 },
            ]}
            placeholder="Select category"
            onChange={(value) => {
              form.setFieldValue("category_id", value);
              setState((prev) => ({ ...prev, selectedParentId: value }));
            }}
          />
        </Form.Item>

        <Form.Item
          label="Price"
          name="price"
          rules={[{ required: true, message: 'Please enter price' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name={"status"} label="Status">
          <Select
            options={[
              { label: "Active", value: 1 },
              { label: "Inactive", value: 0 },
            ]}
            placeholder="Select status"
          />
        </Form.Item>

        <Form.Item name={"description"} label="Description">
          <Input.TextArea rows={4} placeholder="Enter product description" />
        </Form.Item>

        {/* REMOVED: Duplicate Quantity field that was here */}

        <Form.Item name={"image_default"} label="Image">
          <Upload
            customRequest={(options) => options.onSuccess()}
            maxCount={1}
            listType="picture-card"
            fileList={imageDefault}
            onPreview={handlePreview}
            onChange={handleChangeImageDefault}
          >
            <div>+Upload</div>
          </Upload>
        </Form.Item>
      </div>
    </Col>
  </Row>

  {previewImage && (
    <Image
      wrapperStyle={{ display: "none" }}
      preview={{
        visible: previewOpen,
        onVisibleChange: (visible) => setPreviewOpen(visible),
        afterOpenChange: (visible) => !visible && setPreviewImage(""),
      }}
      src={previewImage}
    />
  )}

  <div style={{ textAlign: "right", marginTop: 24 }}>
    <Space>
      <Button onClick={onCloseModal}>Cancel</Button>
      <Button type="primary" htmlType="submit">
        {form.getFieldValue("id") ? "Update" : "Save"}
      </Button>
    </Space>
  </div>
</Form>
      </Modal>

      <Table
        dataSource={state.list}
        columns={[
          {
            key: "name",
            title: "name",
            dataIndex: "name",
          },
          {
            key: "barcode",
            title: "barcode",
            dataIndex: "barcode",
          },
          {
            key: "description",
            title: "description",
            dataIndex: "description",
          },
          {
            key: "category_name",
            title: "category_name",
            dataIndex: "category_name",
          },
          {
            key: "brand",
            title: "brand",
            dataIndex: "brand",
          },
          {
            key: "qty",
            title: "qty",
            dataIndex: "qty",
          },
          {
            key: "price",
            title: "price",
            dataIndex: "price",
          },
          {
            key: "discount",
            title: "discount",
            dataIndex: "discount",
          },

          {
            key: "status",
            title: "status",
            dataIndex: "status",
            render: (status) =>
              status == 1 ? (
                <Tag color="green">Active</Tag>
              ) : (
                <Tag color="red">InActive</Tag>
              ),
          },
          {
            key: "image",
            title: "image",
            dataIndex: "image",
            render: (value) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 60,
                  height: 60,
                  borderRadius: "50%", // Circular shape
                  overflow: "hidden", // Ensures the image stays within the circular boundary
                  border: "2px solid #e0e0e0", // Light gray border
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow
                  transition: "transform 0.3s, box-shadow 0.3s", // Smooth hover effect
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)"; // Slightly enlarge on hover
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)"; // Enhanced shadow on hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)"; // Reset size on hover out
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // Reset shadow on hover out
                }}
              >
                {value ? (
                  <Image
                    src={Config.getFullImagePath(value)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover", // Ensures the image covers the circular area
                    }}
                    preview={{
                      mask: (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay for preview
                            color: "#fff",
                            fontSize: 16,
                          }}
                        >
                          View
                        </div>
                      ),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#EEE", // Light gray background for placeholder
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 14,
                      color: "#999", // Light gray text
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "Action",
            title: "Action",
            align: "center",
            render: (item, data, index) => (
              <Space>
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(data, index)}
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(data, index)}
                />
              </Space>
            ),
          },
          {
              key: "created_by",
              title: "បង្កើតដោយ",
              render: (text, record) => (
                <div>
                  <strong>{record.created_by_name}</strong>
                  {record.created_by_username && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      @{record.created_by_username}
                    </div>
                  )}
                </div>
              ),
            },
        ]}
      />
    </MainPage>
  );
}
export default ProductPage;