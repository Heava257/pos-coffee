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
import { Config } from "../../util/config";

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

function RawMaterialPage() {
    const [form] = Form.useForm();
    const [state, setState] = useState({
        list: [],
        loading: false,
        visibleModal: false,
    });
    const [filter, setFilter] = useState({
        txt_search: "",
        status: "",
    });
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [imageDefault, setImageDefault] = useState([]);

    useEffect(() => {
        getList();
    }, []);

    const getList = async () => {
        setState((pre) => ({ ...pre, loading: true }));
        const param = {
            ...filter,
        };
        const res = await request("raw_material", "get", param);
        if (res && !res.error) {
            setState((pre) => ({
                ...pre,
                list: res.list,
                loading: false,
            }));
        } else {
            setState((pre) => ({ ...pre, loading: false }));
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
        params.append("code", items.code || "");
        params.append("unit", items.unit);
        params.append("price", items.price || 0);
        params.append("qty", items.qty || 0);
        params.append("min_stock", items.min_stock || 0);
        params.append("status", items.status);
        params.append("id", form.getFieldValue("id"));

        // Handle Image
        if (items.image_default) {
            if (items.image_default.file.status === "removed") {
                params.append("image_remove", "1");
            } else {
                params.append(
                    "image",
                    items.image_default.file.originFileObj,
                    items.image_default.file.name
                );
            }
        }

        var method = "post";
        if (form.getFieldValue("id")) {
            method = "put";
        }
        const res = await request("raw_material", method, params);
        if (res && !res.error) {
            message.success(res.message);
            onCloseModal();
            getList();
        } else {
            message.error(res.message || "Something went wrong");
        }
    };

    const onBtnNew = () => {
        form.resetFields();
        setState((p) => ({
            ...p,
            visibleModal: true,
        }));
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

    const onFilter = () => {
        getList();
    };

    const onClickEdit = (item) => {
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

    const onClickDelete = (item) => {
        Modal.confirm({
            title: "Remove Data",
            content: "Are you sure you want to remove this raw material?",
            onOk: async () => {
                const res = await request("raw_material", "delete", { id: item.id });
                if (res && !res.error) {
                    message.success(res.message);
                    getList();
                }
            },
        });
    };

    const columns = [
        {
            key: "no",
            title: "No",
            render: (value, data, index) => index + 1,
        },
        {
            key: "image",
            title: "Image",
            dataIndex: "image",
            render: (value) => (
                <div style={{ width: 50, height: 50, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd" }}>
                    {value ? (
                        <Image
                            src={Config.getFullImagePath(value)}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            preview={true}
                        />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#999" }}>No Img</div>
                    )}
                </div>
            ),
        },
        {
            key: "name",
            title: "Name",
            dataIndex: "name",
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{record.code}</div>
                </div>
            )
        },
        {
            key: "unit",
            title: "Unit",
            dataIndex: "unit",
        },
        {
            key: "qty",
            title: "Current Stock",
            dataIndex: "qty",
            render: (val, record) => (
                <Tag color={val <= record.min_stock ? "red" : "green"}>
                    {val} {record.unit}
                </Tag>
            )
        },
        {
            key: "price",
            title: "Cost Price",
            dataIndex: "price",
            render: (val) => `$${Number(val).toFixed(2)}`
        },
        {
            key: "status",
            title: "Status",
            dataIndex: "status",
            render: (status) =>
                status == 1 ? (
                    <Tag color="green">Active</Tag>
                ) : (
                    <Tag color="red">Inactive</Tag>
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
                        onClick={() => onClickEdit(data)}
                        size="small"
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<MdDelete />}
                        onClick={() => onClickDelete(data)}
                        size="small"
                    />
                </Space>
            ),
        },
    ];

    return (
        <MainPage loading={state.loading}>
            <div className="pageHeader">
                <Space>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Raw Materials</div>
                    <Input.Search
                        onChange={(event) =>
                            setFilter((p) => ({ ...p, txt_search: event.target.value }))
                        }
                        onSearch={onFilter}
                        allowClear
                        placeholder="Search by name or code"
                    />
                    <Select
                        allowClear
                        style={{ width: 130 }}
                        placeholder="Status"
                        options={[
                            { label: "Active", value: 1 },
                            { label: "Inactive", value: 0 },
                        ]}
                        onChange={(val) => {
                            setFilter((pre) => ({ ...pre, status: val }));
                            setTimeout(onFilter, 100);
                        }}
                    />
                </Space>
                <Button type="primary" onClick={onBtnNew} icon={<MdAdd />}>
                    New Material
                </Button>
            </div>

            <Table
                rowKey="id"
                dataSource={state.list}
                columns={columns}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                open={state.visibleModal}
                title={form.getFieldValue("id") ? "Edit Raw Material" : "New Raw Material"}
                footer={null}
                onCancel={onCloseModal}
                width={700}
            >
                <Form layout="vertical" onFinish={onFinish} form={form}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Material Name"
                                rules={[{ required: true, message: "Please enter name" }]}
                            >
                                <Input placeholder="e.g. Coffee Beans" />
                            </Form.Item>

                            <Form.Item name="code" label="Code / SKU">
                                <Input placeholder="e.g. RM-001" />
                            </Form.Item>

                            <Form.Item
                                name="unit"
                                label="Unit of Measure"
                                rules={[{ required: true, message: "Please enter unit" }]}
                            >
                                <Select
                                    placeholder="Select or type unit"
                                    options={[
                                        { label: "Gram (g)", value: "g" },
                                        { label: "Kilogram (kg)", value: "kg" },
                                        { label: "Milliliter (ml)", value: "ml" },
                                        { label: "Liter (l)", value: "l" },
                                        { label: "Piece (pcs)", value: "pcs" },
                                        { label: "Can", value: "can" },
                                        { label: "Pack", value: "pack" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item name="status" label="Status" initialValue={1}>
                                <Select
                                    options={[
                                        { label: "Active", value: 1 },
                                        { label: "Inactive", value: 0 },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="price" label="Cost Price (per unit)" initialValue={0}>
                                <InputNumber style={{ width: "100%" }} min={0} step={0.01} addonBefore="$" />
                            </Form.Item>

                            <Form.Item name="qty" label="Initial Stock" initialValue={0}>
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>

                            <Form.Item name="min_stock" label="Min Stock Alert" initialValue={10}>
                                <InputNumber style={{ width: "100%" }} min={0} />
                            </Form.Item>

                            <Form.Item name="image_default" label="Image">
                                <Upload
                                    customRequest={(options) => options.onSuccess()}
                                    maxCount={1}
                                    listType="picture-card"
                                    fileList={imageDefault}
                                    onPreview={handlePreview}
                                    onChange={handleChangeImageDefault}
                                    onRemove={() => setImageDefault([])}
                                >
                                    {imageDefault.length >= 1 ? null : <div>+ Upload</div>}
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: "right", marginTop: 20 }}>
                        <Space>
                            <Button onClick={onCloseModal}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                {form.getFieldValue("id") ? "Update" : "Save"}
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

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
        </MainPage>
    );
}

export default RawMaterialPage;
