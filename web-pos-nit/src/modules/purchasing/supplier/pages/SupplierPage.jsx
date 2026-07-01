import React, { useEffect, useState } from "react";
import { request } from "@/shared/utils/helper";
import MainPage from "@/app/layouts/MainPage";
import { Button, Form, Input, message, Modal, Space, Table, Alert } from "antd";
import dayjs from "dayjs";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { useLanguage, translations } from "@/app/store/language.store";
import { HelpCircle } from "lucide-react";

function SupplierPage() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const [form] = Form.useForm();
  const [showGuide, setShowGuide] = useState(false);
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
    txtSearch: "",
  });
  useEffect(() => {
    getList();
  }, []);
  const getList = async () => {
    setState((p) => ({
      ...p,
      loading: true,
    }));
    var param = {
      txtSearch: state.txtSearch,
    };
    const res = await request("supplier", "get", param);
    if (res && !res.error) {
      setState((p) => ({
        ...p,
        list: res.list,
        loading: false,
      }));
    }
  };
  const openModal = () => {
    setState((p) => ({
      ...p,
      visible: true,
    }));
  };
  const closeModal = () => {
    setState((p) => ({
      ...p,
      visible: false,
    }));
    form.resetFields();
  };
  const onFinish = async (items) => {
    var method = "post";
    if (form.getFieldValue("id")) {
      method = "put";
    }
    setState((p) => ({
      ...p,
      loading: true,
    }));
    const res = await request("supplier", method, {
      ...items,
      id: form.getFieldValue("id"),
    });
    if (res && !res.error) {
      getList();
      closeModal();
      message.success(res.message);
    }
  };
  const onClickBtnEdit = (items) => {
    form.setFieldsValue({
      ...items,
      id: items.id,
    });
    openModal();
  };
  const onClickBtnDelete = (items) => {
    Modal.confirm({
      title: t.delete + " " + t.supplier,
      content: t.confirm_delete_supplier,
      onOk: async () => {
        setState((p) => ({
          ...p,
          loading: true,
        }));
        const res = await request("supplier", "delete", {
          id: items.id,
        });

        if (res && !res.error) {
          const newList = state.list.filter((item) => item.id !== items.id);
          setState((p) => ({
            ...p,
            list: newList,
            loading: false,
          }));
          message.success(t.supplier_deleted);
        } else {
          message.error(res?.message || "Error deleting supplier");
          setState((p) => ({
            ...p,
            loading: false,
          }));
        }
      },
    });
  };

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{t.supplier_list}</span>
            <Button
              type="text"
              icon={<HelpCircle size={15} style={{ color: "#2d6a42", marginRight: 4 }} />}
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background: showGuide ? "rgba(45, 106, 66, 0.15)" : "rgba(45, 106, 66, 0.08)",
                color: "#2d6a42",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                height: 32,
              }}
            >
              {showGuide ? "លាក់ការណែនាំ" : "របៀបប្រើប្រាស់"}
            </Button>
          </div>
          <Input.Search
            onChange={(value) =>
              setState((p) => ({ ...p, txtSearch: value.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder={t.search}
          />
        </Space>
        <Button type="primary" className="tour-supplier-add-btn" onClick={openModal} icon={<MdOutlineCreateNewFolder />}>
          {t.add_new}
        </Button>
      </div>

      {showGuide && (
        <Alert
          message={<strong>💡 របៀបគ្រប់គ្រងអ្នកផ្គត់ផ្គង់ (Supplier Directory Guide)</strong>}
          description={
            <div style={{ fontSize: 13, marginTop: 4, color: '#333' }}>
              <p style={{ margin: '3px 0' }}>1. <strong>ចុះឈ្មោះអ្នកលក់ដុំ (Create Supplier)៖</strong> ចុចប៊ូតុង <strong>[+ Create New]</strong> ឬ <strong>[បង្កើតថ្មី]</strong> ដើម្បីបញ្ចូលព័ត៌មានអ្នកលក់ ឬដៃគូផ្គត់ផ្គង់វត្ថុធាតុដើមឱ្យអាជីវកម្មរបស់បង (ដូចជាឈ្មោះ លេខទូរស័ព្ទ អ៊ីមែល និងអាសយដ្ឋាន)។</p>
              <p style={{ margin: '3px 0' }}>2. <strong>ការស្វែងរក និងទំនាក់ទំនង៖</strong> បងអាចស្វែងរកអ្នកផ្គត់ផ្គង់តាមឈ្មោះ ឬលេខកូដ និងទូរស័ព្ទទៅពួកគេដោយផ្ទាល់នៅពេលដែលស្តុកទំនិញជិតអស់។</p>
              <p style={{ margin: '3px 0' }}>3. <strong>តំណភ្ជាប់ទៅការទិញចូល (Purchase linkage)៖</strong> ព័ត៌មានអ្នកផ្គត់ផ្គង់ដែលបានបង្កើត នឹងបង្ហាញឱ្យជ្រើសរើសនៅពេលបងបង្កើតប័ណ្ណទិញចូលស្តុក (Purchase Orders)។</p>
            </div>
          }
          type="info"
          closable
          onClose={() => setShowGuide(false)}
          style={{ borderRadius: 16, marginBottom: 24, border: '1px solid #bae7ff', background: '#e6f7ff' }}
        />
      )}
      <Modal
        open={state.visible}
        title={<b>{form.getFieldValue("id") ? t.edit_supplier : t.add_new_supplier}</b>}
        onCancel={closeModal}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="name"
            label={t.name}
            rules={[{ required: true, message: t.name + " is required!" }]}
          >
            <Input placeholder={t.name} />
          </Form.Item>

          <Form.Item
            name="code"
            label={t.code}
            rules={[{ required: true, message: t.code + " is required!" }]}
          >
            <Input placeholder={t.code} />
          </Form.Item>

          <Form.Item
            name="tel"
            label={t.tel}
            rules={[{ required: true, message: t.tel + " is required!" }]}
          >
            <Input placeholder={t.tel} />
          </Form.Item>

          <Form.Item
            name="email"
            label={t.email}
            rules={[{ required: true, message: t.email + " is required!" }]}
          >
            <Input placeholder={t.email} />
          </Form.Item>

          <Form.Item
            name="address"
            label={t.address}
            rules={[{ required: true, message: t.address + " is required!" }]}
          >
            <Input placeholder={t.address} />
          </Form.Item>

          <Form.Item
            name="website"
            label={t.website}
          >
            <Input placeholder={t.website} />
          </Form.Item>

          <Form.Item
            name="note"
            label={t.note}
          >
            <Input.TextArea placeholder={t.note} />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Space>
              <Button onClick={closeModal}>{t.cancel}</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? t.edit : t.save}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        rowClassName={() => "pos-row"}
        dataSource={state.list}
        columns={[
          {
            key: "name",
            title: t.name,
            dataIndex: "name",
          },
          {
            key: "code",
            title: t.code,
            dataIndex: "code",
          },
          {
            key: "tel",
            title: t.tel,
            dataIndex: "tel",
          },
          {
            key: "email",
            title: t.email,
            dataIndex: "email",
          },
          {
            key: "address",
            title: t.address,
            dataIndex: "address",
          },
          {
            key: "website",
            title: t.website,
            dataIndex: "website",
          },
          {
            key: "create_at",
            title: t.created_at,
            dataIndex: "create_at",
            render: (value) => dayjs(value).format("DD/MM/YYYY"),
          },
          {
            key: "action",
            title: t.action,
            align: 'center',
            render: (value, data) => (
              <Space>
                <Button type="primary" onClick={() => onClickBtnEdit(data)}>
                  {t.edit}
                </Button>
                <Button type="primary" danger onClick={() => onClickBtnDelete(data)}>
                  {t.delete}
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </MainPage>
  );
}

export default SupplierPage;