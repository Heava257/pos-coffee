import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";

const { Text } = Typography;

const defaultParentCategories = [
  { id: "all", name: "All", icon: "🍽️", color: "#ff6b35" },
  { id: 51, name: "Coffee", icon: "☕", color: "#8B4513" },
  { id: 52, name: "Juice", icon: "🧃", color: "#4CAF50" },
  { id: 53, name: "Milk Based", icon: "🥛", color: "#2196F3" },
  { id: 54, name: "Snack", icon: "🍪", color: "#FF9800" },
  { id: 55, name: "Rice", icon: "🍚", color: "#E91E63" },
  { id: 56, name: "Dessert", icon: "🍰", color: "#9C27B0" },
];

// Helper functions for category styling
const getIconForCategory = (name) => {
  const iconMap = {
    "Coffee": "☕",
    "Juice": "🧃",
    "Milk Based": "🥛",
    "Snack": "🍪",
    "Rice": "🍚",
    "Dessert": "🍰"
  };
  return iconMap[name] || "📁";
};

const getColorForCategory = (name) => {
  const colorMap = {
    "Coffee": "#8B4513",
    "Juice": "#4CAF50",
    "Milk Based": "#2196F3",
    "Snack": "#FF9800",
    "Rice": "#E91E63",
    "Dessert": "#9C27B0"
  };
  return colorMap[name] || "#666666";
};

// Helper function to get user profile (you'll need to implement this based on your auth system)
const getProfile = () => {
  // Replace with your actual user profile retrieval logic
  return { id: 1 }; // Placeholder
};

function CategoryPage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [parentCategories, setParentCategories] = useState(defaultParentCategories);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    description: "",
    status: "",
    parentId: null,
    txtSearch: "",
  });

  // Add these missing state variables that were referenced but not defined
  const [filter] = useState({});
  const refPage = React.useRef(1);

  useEffect(() => {
    getList();
    getParentCategories();
  }, [selectedCategory]);

  useEffect(() => {
  console.log("🔍 Parent Categories Debug:", {
    totalCategories: parentCategories.length,
    categories: parentCategories,
    filteredForDropdown: parentCategories.filter(c => c.id !== "all"),
    loading: loading
  });
}, [parentCategories, loading]);


  useEffect(() => {
    filterItems();
  }, [selectedCategory, list, state.txtSearch]);

  const getList = async () => {
    let param = {
      ...filter,
      page: refPage.current,
      is_list_all: 1,
    };

    // Use category_id for filtering instead of parent_id
    if (selectedCategory !== "all") {
      param.category_id = selectedCategory;
    }

    const { id } = getProfile();
    if (!id) return;

    setLoading(true);

    try {
      const res = await request(`category`, "get", param); // Changed from product to category
      if (res && !res.error) {


        setList(res.list || []);
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setLoading(false);
    }
  };
  // Replace your existing getParentCategories function with this updated version:

 const getParentCategories = async () => {
  try {
    // Use the new enhanced endpoint
    const res = await request("category/getParentCategoriesWithDefaults", "get");
    
    if (res && res.list) {
      const parents = res.list.map(category => ({
        id: category.id,
        name: category.name,
        icon: getIconForCategory(category.name),
        color: getColorForCategory(category.name),
      }));

      setParentCategories([
        { id: "all", name: "All", icon: "🍽️", color: "#ff6b35" },
        ...parents
      ]);
    }
  } catch (error) {
    console.error("Failed to fetch parent categories:", error);
    setParentCategories(defaultParentCategories);
  }
};
  // Alternative solution - if you prefer to use a different endpoint:
  const getParentCategoriesAlternative = async () => {
    try {
      // This will get all categories and filter for parent categories
      const res = await request("category", "get");
      if (res && res.list) {
        // Get unique parent categories
        const parentIdSet = new Set();
        const parentCategoriesMap = new Map();

        // First, collect all categories that are used as parents
        res.list.forEach(item => {
          if (item.parent_id) {
            parentIdSet.add(item.parent_id);
          }
        });

        // Then find the actual parent category records
        res.list.forEach(item => {
          if (parentIdSet.has(item.id)) {
            parentCategoriesMap.set(item.id, item);
          }
        });

        const labelMap = {
          51: "Coffee",
          52: "Juice",
          53: "Milk Based",
          54: "Snack",
          55: "Rice",
          56: "Dessert"
        };

        // Convert to array format needed for the UI
        const parents = Array.from(parentCategoriesMap.values()).map(category => ({
          id: category.id,
          name: category.name || labelMap[category.id] || `Category ${category.id}`,
          icon: getIconForCategory(category.name || labelMap[category.id]),
          color: getColorForCategory(category.name || labelMap[category.id]),
        }));


        setParentCategories([
          { id: "all", name: "All", icon: "🍽️", color: "#ff6b35" },
          ...parents
        ]);
      } else {
        console.warn("⚠️ No categories found, using defaults");
        setParentCategories(defaultParentCategories);
      }
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      setParentCategories(defaultParentCategories);
    }
  };

  // const getParentCategories = async () => {
  //   try {
  //     const res = await request("category", "get");
  //     if (res && res.list) {
  //       const parentIdSet = new Set();

  //       // Collect all parent_id values
  //       res.list.forEach(item => {
  //         if (item.parent_id) {
  //           parentIdSet.add(item.parent_id);
  //         }
  //       });

  //       const labelMap = {
  //         51: "Coffee",
  //         52: "Juice",
  //         53: "Milk Based",
  //         54: "Snack",
  //         55: "Rice",
  //         56: "Dessert"
  //       };

  //       const parents = Array.from(parentIdSet).map(pid => {
  //         const matching = res.list.find(c => c.id === pid);
  //         const name = matching?.name || labelMap[pid] || `Category ${pid}`;
  //         return {
  //           id: pid,
  //           name,
  //           icon: getIconForCategory(name),
  //           color: getColorForCategory(name),
  //         };
  //       });


  //       setParentCategories([
  //         { id: "all", name: "All", icon: "🍽️", color: "#ff6b35" },
  //         ...parents
  //       ]);
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch categories:", error);
  //     setParentCategories(defaultParentCategories);
  //   }
  // };

  const filterItems = () => {
    let filtered = list;

    // Filter by category
    if (selectedCategory !== "all") {
      const numericCategory = Number(selectedCategory);
      if (!isNaN(numericCategory)) {
        filtered = filtered.filter(item => Number(item.parent_id) === numericCategory);
      }
    }

    // Filter by search text
    if (state.txtSearch) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(state.txtSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(state.txtSearch.toLowerCase()))
      );
    }

    setFilteredList(filtered);
  };

  const onClickEdit = (data) => {
    setState({
      ...state,
      visibleModal: true,
      id: data.id,
    });
    formRef.setFieldsValue({
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      parentId: data.parent_id,
    });
  };

  const onClickDelete = async (data) => {
    Modal.confirm({
      title: "លុប",
      content: "Are you sure you want to remove this category?",
      okText: "យល់ព្រម",
      cancelText: "បោះបង់",
      onOk: async () => {
        try {
          const res = await request("category", "delete", { id: data.id });
          if (res && !res.error) {
            message.success(res.message);
            getList();
          }
        } catch (error) {
          message.error("Failed to delete category");
        }
      },
    });
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
      id: null,
    });
    formRef.resetFields();
    // Pre-select current category if not "All"
    if (selectedCategory !== "all") {
      formRef.setFieldsValue({ parentId: Number(selectedCategory) });
    }
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
  };

  const onFinish = async (items) => {
    const data = {
      id: formRef.getFieldValue("id"),
      name: items.name,
      description: items.description,
      status: items.status,
      parent_id: items.parentId || 0,
    };

    try {
      const method = data.id ? "put" : "post";
      const res = await request("category", method, data);

      if (res && !res.error) {
        message.success(res.message);
        getList();
        getParentCategories();
        onCloseModal();
      }
    } catch (error) {
      message.error("Failed to save category");
    }
  };

  const CategoryCard = ({ category, isSelected, onClick }) => (
    <div
      onClick={() => onClick(category.id.toString())}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        height: 80,
        borderRadius: 12,
        background: isSelected ? category.color : 'white',
        boxShadow: isSelected
          ? `0 4px 12px ${category.color}40`
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isSelected ? 'none' : '1px solid #e8e9ea',
        transform: isSelected ? 'translateY(-2px)' : 'none'
      }}
    >
      <div style={{
        fontSize: 24,
        marginBottom: 4,
        filter: isSelected ? 'brightness(1.2)' : 'none'
      }}>
        {category.icon}
      </div>
      <Text style={{
        fontSize: 12,
        color: isSelected ? 'white' : '#666',
        fontWeight: isSelected ? 600 : 400,
        textAlign: 'center',
        lineHeight: 1.2
      }}>
        {category.name}
      </Text>
    </div>
  );

  return (
    <MainPage loading={loading}>
      <div className="category-page" style={{ padding: '20px' }}>
        {/* Header */}
        <div className="pageHeader" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <div className="khmer-title" style={{ fontSize: '20px', fontWeight: 'bold' }}>ប្រភេទផលិតផល</div>
            <Input.Search
              onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
              allowClear
              placeholder="Search items..."
              style={{ width: '300px' }}
            />
          </Space>
          <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
            NEW
          </Button>
        </div>

        {/* Category Selection */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>ជ្រើសរើសប្រភេទ:</h3>
          <Row gutter={[12, 12]}>
            {parentCategories.map((category) => (
              <Col key={category.id} span={3}>
                <CategoryCard
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={setSelectedCategory}
                />
              </Col>
            ))}
          </Row>
        </div>

        <Divider />

        {/* Items Table */}
        <div style={{ marginBottom: '12px' }}>
          <h3>
            {selectedCategory === "all"
              ? `ទាំងអស់ (${filteredList.length} items)`
              : `${parentCategories.find(c => c.id === selectedCategory)?.name} (${filteredList.length} items)`
            }
          </h3>
        </div>

        <Table
          pagination={false}
          dataSource={filteredList}
          loading={loading}
          rowKey="id"
          columns={[
            {
              key: "No",
              title: "លេខ",
              render: (item, data, index) => index + 1,
              width: 60,
            },
            {
              key: "category",
              title: "ប្រភេទ",
              dataIndex: "parent_id",
              render: (parentId) => {
                const category = parentCategories.find(c => Number(c.id) === Number(parentId));
                return category && category.id !== "all" ? (
                  <Tag color={category.color}>
                    {category.icon} {category.name}
                  </Tag>
                ) : null;
              }
            },
            {
              key: "name",
              title: "ឈ្មោះ",
              dataIndex: "name",
              render: (text) => <strong>{text}</strong>,
            },
            {
              key: "description",
              title: "សេចក្ដីពិពណ៌នា",
              dataIndex: "description",
            },
            {
              key: "status",
              title: "ស្ថានភាព",
              dataIndex: "status",
              render: (status) => (
                status === 1 ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>
              ),
            },

            {
              key: "Action",
              title: "សកម្មភាព",
              align: "center",
              render: (item, data) => (
                <Space>
                  <Button type="primary" icon={<MdEdit />} onClick={() => onClickEdit(data)} />
                  <Button type="primary" danger icon={<MdDelete />} onClick={() => onClickDelete(data)} />
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

        {/* Modal for Add/Edit */}
        <Modal
          open={state.visibleModal}
          title={state.id ? "កែសម្រួលផលិតផល" : "ផលិតផលថ្មី"}
          footer={null}
          onCancel={onCloseModal}
          width={600}
        >
          <Form layout="vertical" onFinish={onFinish} form={formRef}>
            <Form.Item
              name="name"
              label="ឈ្មោះផលិតផល"
              rules={[{ required: true, message: "Please enter product name!" }]}
            >
              <Input placeholder="Input product name" />
            </Form.Item>

            <Form.Item name="description" label="ការពិពណ៌នា">
              <Input.TextArea placeholder="Enter description" rows={3} />
            </Form.Item>

            <Form.Item
              name="parentId"
              label="ប្រភេទ"
              rules={[{ required: true, message: "Please select a category!" }]}
            >
              <Select
                placeholder="Select category"
                notFoundContent="Loading categories..."
                loading={loading}
              >
                {parentCategories
                  .filter(c => c.id !== "all")
                  .map(category => (
                    <Select.Option key={category.id} value={Number(category.id)}>
                      {category.icon} {category.name}
                    </Select.Option>
                  ))
                }
              </Select>
            </Form.Item>

            <Form.Item name="status" label="ស្ថានភាព">
              <Select
                placeholder="Select status"
                options={[
                  { label: "សកម្ម", value: 1 },
                  { label: "អសកម្ម", value: 0 },
                ]}
              />
            </Form.Item>

            <Space style={{ float: 'right' }}>
              <Button onClick={onCloseModal}>
                បោះបង់
              </Button>
              <Button type="primary" htmlType="submit">
                {state.id ? "កែសម្រួល" : "រក្សាទុក"}
              </Button>
            </Space>
          </Form>
        </Modal>
      </div>
    </MainPage>
  );
}

export default CategoryPage;