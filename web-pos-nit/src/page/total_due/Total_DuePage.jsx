import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import { formatDateClient, isPermission, request } from "../../util/helper";
import { MdDelete, MdEdit, MdPayment } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import * as XLSX from "xlsx/xlsx.mjs";
import { BsSearch } from "react-icons/bs";
import { IoIosBook } from "react-icons/io";

function Total_DuePage() {
  const { config } = configStore();
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [createByOptions, setCreateByOptions] = useState([]);
  const [state, setState] = useState({
    list: [],
    total: 0,
    loading: false,
    visibleModal: false,
    visiblePaymentModal: false,
    is_list_all: false,
    editingRecord: null,
    payingRecord: null,
  });
  const refPage = React.useRef(1);
  const [filter, setFilter] = useState({
    txt_search: "",
    category_id: "",
    brand: "",
    create_by: "",
  });

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const param = {
        ...filter,
        page: refPage.current,
      };
      const res = await request("gettotal_due", "get", param);
      if (res && !res.error) {
        setState((prev) => ({
          ...prev,
          list: res.list,
          total: refPage.current === 1 ? res.total : prev.total,
          loading: false,
        }));
      } else {
        message.error(res?.error || "Failed to fetch data");
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("An error occurred while fetching data");
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const onFilter = () => {
    getList();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const ExportToExcel = () => {
    if (state.list.length === 0) {
      message.warning("No data available to export.");
      return;
    }
    const hideLoadingMessage = message.loading(
      <div className="khmer-text">សូមមេត្តារងចាំ...</div>,
      0
    );
    setTimeout(() => {
      const data = state.list.map((item) => ({
        ...item,
        create_at: formatDateClient(item.create_at),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Product");
      XLSX.writeFile(wb, "Product_Data.xlsx");
      hideLoadingMessage();
      message.success("Export completed successfully!");
    }, 2000);
  };

  const onClickPay = (record) => {
    setState((prev) => ({
      ...prev,
      visiblePaymentModal: true,
      payingRecord: record,
    }));
    paymentForm.setFieldsValue({
      paid_amount: record.paid_amount || 0,
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields();
      const { payingRecord } = state;

      if (!payingRecord || !payingRecord.id) {
        message.error("Invalid record selected for payment update");
        return;
      }

      const paidAmount = parseFloat(values.paid_amount);
      if (isNaN(paidAmount) || paidAmount < 0) {
        message.error("Please enter a valid payment amount");
        return;
      }

      const payload = {
        id: payingRecord.id,
        paid_amount: paidAmount,
      };

      const res = await request("updateTotalDue", "put", payload);
      if (res && !res.error) {
        message.success("Payment updated successfully!");
        setState((prev) => ({
          ...prev,
          visiblePaymentModal: false,
          payingRecord: null,
        }));
        paymentForm.resetFields();
        getList(); // Refresh the data
      } else {
        message.error(res?.error || "Failed to update payment.");
      }
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Form validation failed");
    }
  };

  const handlePaymentModalCancel = () => {
    setState((prev) => ({
      ...prev,
      visiblePaymentModal: false,
      payingRecord: null,
    }));
    paymentForm.resetFields();
  };

  return (
    <MainPage loading={state.loading}>
      <div className="pageHeader">
        <Space>
          <div>Product {state.total}</div>
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
            style={{ width: 160 }}
            placeholder="Brand"
            options={config.brand}
            onChange={(id) => {
              setFilter((pre) => ({ ...pre, brand: id }));
            }}
          />
          <Select
            allowClear
            showSearch
            style={{ width: 160 }}
            placeholder="Created By"
            options={config?.createby}
            onChange={(value) => {
              setFilter((pre) => ({ ...pre, create_by: value }));
            }}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button onClick={onFilter} type="primary" icon={<BsSearch />}>
            Filter
          </Button>
        </Space>
        <Button onClick={ExportToExcel} type="primary" icon={<IoIosBook />}>
          Export to Excel
        </Button>
      </div>
      <Table
        className="custom-table"
        rowClassName={() => "pos-row"}
        dataSource={state.list}
        columns={[
          {
            key: "customer_name",
            title: (
              <div>
                <div className="khmer-text">ឈ្មោះអ្នកជំពាក់</div>
                <div className="english-text">User Name</div>
              </div>
            ),
            dataIndex: "customer_name",
            render: (text) => (
              <div className="truncate-text" title={text || ""}>
                {text || "N/A"}
              </div>
            ),
          },
        
          {
            key: "branch_name",
            title: (
              <div>
                <div className="khmer-text">អាសយដ្ឋាន</div>
                <div className="english-text">Address</div>
              </div>
            ),
            dataIndex: "branch_name",
          },
          {
            key: "tel",
            title: (
              <div>
                <div className="khmer-text">លេខទូរស័ព្ទ</div>
                <div className="english-text">Tel</div>
              </div>
            ),
            dataIndex: "tel",
          },
          {
            key: "order_date",
            title: (
              <div>
                <div className="khmer-text">កាលបរិច្ឆេទកម្មវិធី</div>
                <div className="english-text">Order Date</div>
              </div>
            ),
            dataIndex: "order_date",
            render: (value) => formatDateClient(value, "DD/MM/YYYY H:m A"),
          },
          {
            key: "total_due",
            title: (
              <div>
                <div className="khmer-text">តម្លៃសរុប</div>
                <div className="english-text">Total Due</div>
              </div>
            ),
            dataIndex: "total_due",
            render: (value) => <Tag color="red">{formatCurrency(value)}</Tag>,
          },
          {
            key: "create_by",
            title: (
              <div>
                <div className="khmer-text">បង្កើតដោយ</div>
                <div className="english-text">Created By</div>
              </div>
            ),
            dataIndex: "create_by",  // This column will display the user who created the entry
          },
          {
            key: "Action",
            title: (
              <div className="table-header">
                <div className="khmer-text">សកម្មភាព</div>
                <div className="english-text">Action</div>
              </div>
            ),
            // align: "center",
            // render: (item, data, index) => (
              // <Space>
              //   <Button
              //     type="primary"
              //     icon={<MdPayment />}
              //     onClick={() => onClickPay(data)}
              //   />
              // </Space>
            // ),
          },
        ]}
      />


      <Modal
        title="Update Payment"
        visible={state.visiblePaymentModal}
        onOk={handlePaymentSubmit}
        onCancel={handlePaymentModalCancel}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            label="Paid Amount"
            name="paid_amount"
            rules={[{ required: true, message: "Please enter the paid amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </MainPage>
  );
}

export default Total_DuePage;