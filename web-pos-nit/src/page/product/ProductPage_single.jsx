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
import { MdAdd, MdDelete, MdEdit, MdRestaurantMenu } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { getProfile } from "../../store/profile.store";
import "./Product.css"
import RecipeModal from "./RecipeModal";
import { useLanguage, translations } from "../../store/language.store";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function ProductPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
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
  const [visibleRecipeModal, setVisibleRecipeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    const res = await request(`product`, "get", param);
    if (res && !res.error) {
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
        totals,
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
      message.success(t.product_saved);
      onCloseModal();
      getList();
    } else {
      res.error?.barcode && message.error(res.error?.barcode);
    }
  };
  const onBtnNew = async () => {
    try {
      const res = await request("new_barcode", "post");
      if (res && res.barcode) {
        const checkRes = await request(`check-barcode/${res.barcode}`, "get");
        if (checkRes && checkRes.exists) {
          return onBtnNew();
        }
        form.setFieldValue("barcode", res.barcode);
      }
    } catch (err) {
      console.error("Barcode generation failed:", err);
    } finally {
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
    setState((pre) => ({ ...pre, visibleModal: true, selectedParentId: item.category_id }));
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
      title: t.remove_data,
      content: t.confirm_remove_product,
      okText: t.delete,
      okType: "danger",
      onOk: async () => {
        const res = await request("product", "delete", item);
        if (res && !res.error) {
          message.success(t.product_deleted);
          getList();
        }
      },
    });
  };

  const onClickRecipe = (item) => {
    setSelectedProduct(item);
    setVisibleRecipeModal(true);
  };

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">

        <Space>
          <div>{t.products} {state.list.length}</div>
          <Input.Search
            onChange={(event) =>
              setFilter((p) => ({ ...p, txt_search: event.target.value }))
            }
            allowClear
            placeholder={t.search}
            onSearch={onFilter}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.category}
            options={config.category}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, category_id: id }));
            }}
          />
          <Select
            allowClear
            style={{ width: 130 }}
            placeholder={t.brand}
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />
          <Button onClick={onFilter} type="primary">
            {t.filter}
          </Button>
        </Space>
        <Button type="primary" onClick={onBtnNew}>
          {t.add_new}
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={form.getFieldValue("id") ? t.edit_product : t.add_new_product}
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
                  label={t.product_name}
                  rules={[{ required: true, message: t.product_name + " is required" }]}
                >
                  <Input placeholder={t.product_name} />
                </Form.Item>

                {state.selectedParentId === 51 && (
                  <>
                    <Form.List name="sizes">
                      {(fields, { add, remove }) => (
                        <>
                          <h3>{t.sizes}</h3>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="start">
                              <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]}>
                                <Select options={SAMPLE_SIZES} placeholder={t.sizes} style={{ width: 120 }} />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price required' }]}>
                                <InputNumber placeholder={t.price} />
                              </Form.Item>
                              <Button danger onClick={() => remove(name)}>{t.delete}</Button>
                            </Space>
                          ))}
                          <Button type="link" onClick={() => add()} icon={<MdAdd />}>{t.add_size}</Button>
                        </>
                      )}
                    </Form.List>

                    <Form.List name="addons">
                      {(fields, { add, remove }) => (
                        <>
                          <h3>{t.addons}</h3>
                          {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="start">
                              <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]}>
                                <Select options={SAMPLE_ADDONS} placeholder={t.addons} style={{ width: 180 }} />
                              </Form.Item>
                              <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price required' }]}>
                                <InputNumber placeholder={t.price} />
                              </Form.Item>
                              <Button danger onClick={() => remove(name)}>{t.delete}</Button>
                            </Space>
                          ))}
                          <Button type="link" onClick={() => add()} icon={<MdAdd />}>{t.add_addon}</Button>
                        </>
                      )}
                    </Form.List>
                  </>
                )}

                <Form.Item name={"barcode"} label={t.barcode}>
                  <Input disabled placeholder={t.barcode} />
                </Form.Item>

                <Form.Item name={"qty"} label={t.quantity}>
                  <InputNumber placeholder={t.quantity} style={{ width: "100%" }} />
                </Form.Item>

                {state.selectedParentId !== 55 && (
                  <Form.Item name={"discount"} label={t.discount}>
                    <InputNumber placeholder={t.discount} style={{ width: "100%" }} />
                  </Form.Item>
                )}
              </div>
            </Col>

            <Col span={12}>
              <div className="form-section">
                <Form.Item
                  name={"category_id"}
                  label={t.category}
                  rules={[{ required: true, message: t.category + " is required" }]}
                >
                  <Select
                    options={config.category}
                    placeholder={t.category}
                    onChange={(value) => {
                      form.setFieldValue("category_id", value);
                      setState((prev) => ({ ...prev, selectedParentId: value }));
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={t.price}
                  name="price"
                  rules={[{ required: true, message: t.price + ' is required' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name={"status"} label={t.status}>
                  <Select
                    options={[
                      { label: t.active, value: 1 },
                      { label: t.inactive, value: 0 },
                    ]}
                    placeholder={t.status}
                  />
                </Form.Item>

                <Form.Item name={"description"} label={t.description}>
                  <Input.TextArea rows={4} placeholder={t.description} />
                </Form.Item>

                <Form.Item name={"image_default"} label={t.image}>
                  <Upload
                    customRequest={(options) => options.onSuccess()}
                    maxCount={1}
                    listType="picture-card"
                    fileList={imageDefault}
                    onPreview={handlePreview}
                    onChange={handleChangeImageDefault}
                  >
                    <div>+{t.image}</div>
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
              <Button onClick={onCloseModal}>{t.cancel}</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? t.save : t.add_new}
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
            title: t.name,
            dataIndex: "name",
          },
          {
            key: "barcode",
            title: t.barcode,
            dataIndex: "barcode",
          },
          {
            key: "description",
            title: t.description,
            dataIndex: "description",
          },
          {
            key: "category_name",
            title: t.category,
            dataIndex: "category_name",
          },
          {
            key: "brand",
            title: t.brand,
            dataIndex: "brand",
          },
          {
            key: "qty",
            title: t.quantity,
            dataIndex: "qty",
          },
          {
            key: "price",
            title: t.price,
            dataIndex: "price",
          },
          {
            key: "discount",
            title: t.discount,
            dataIndex: "discount",
          },

          {
            key: "status",
            title: t.status,
            dataIndex: "status",
            render: (status) =>
              status == 1 ? (
                <Tag color="green">{t.active}</Tag>
              ) : (
                <Tag color="red">{t.inactive}</Tag>
              ),
          },
          {
            key: "image",
            title: t.image,
            dataIndex: "image",
            render: (value) => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #e0e0e0",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                {value ? (
                  <Image
                    src={Config.getFullImagePath(value)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
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
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            fontSize: 16,
                          }}
                        >
                          {t.view_details}
                        </div>
                      ),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#EEE",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 10,
                      color: "#999",
                      textAlign: "center",
                      padding: 2
                    }}
                  >
                    {t.no_data}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "Action",
            title: t.action,
            align: "center",
            render: (item, data, index) => (
              <Space>
                <Button
                  title={t.recipe || "Recipe"}
                  style={{ borderColor: "#faad14", color: "#faad14" }}
                  icon={<MdRestaurantMenu />}
                  onClick={() => onClickRecipe(item)}
                />
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
            title: t.staff,
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
      <RecipeModal
        open={visibleRecipeModal}
        onCancel={() => {
          setVisibleRecipeModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </MainPage>
  );
}
export default ProductPage;