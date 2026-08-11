/**
 * PRATIKSHYA FASHON — Employee operations reads.
 *
 * Role portals read mall-floor mock data here. Customer checkout orders
 * are pulled from the existing order service when present so sales and
 * support are not working from a disconnected dataset.
 */

import { INITIAL_DEMO_CUSTOMERS } from "../../data/mockCustomers";
import {
  MOCK_APPOINTMENTS,
  MOCK_ASSISTED_ORDERS,
  MOCK_FEEDBACK,
  MOCK_FOLLOW_UPS,
  MOCK_OFFERS,
  MOCK_PERFORMANCE,
  MOCK_STOCK_MOVEMENTS,
  MOCK_SUPPORT_CASES,
  MOCK_STYLING_REQUESTS,
  MOCK_TRANSFERS,
  MOCK_WALKIN_CUSTOMERS,
  MOCK_WAREHOUSE_TASKS,
} from "../../data/employees/operations";
import { products } from "../../data/products";
import { loadOrders } from "../orders/orderService";
import { readStorage } from "../../utils/shopping";

const CUSTOMERS_REGISTRY_KEY = "pratikshya_customers_registry";
import { todayKey } from "../../utils/employee";
import { EMPLOYEE_STORAGE_KEYS } from "./storage";

export const getRegisteredCustomers = () => {
  const stored = readStorage(CUSTOMERS_REGISTRY_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return INITIAL_DEMO_CUSTOMERS;
};

export const getDirectoryCustomers = () => {
  const registered = getRegisteredCustomers().map((customer) => ({
    id: customer.id,
    name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
    phone: customer.phone,
    email: customer.email,
    interest: "Atelier account",
    lastVisit: "Account",
    associate: "—",
    source: "account",
  }));
  const walkins = MOCK_WALKIN_CUSTOMERS.map((customer) => ({
    ...customer,
    source: "floor",
  }));
  return [...walkins, ...registered];
};

export const getBusinessOrders = () => loadOrders();

export const getAssistedOrders = (employeeId = null) => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.ASSISTED_ORDERS, null);
  const extra = Array.isArray(stored) ? stored : [];
  const all = [...extra, ...MOCK_ASSISTED_ORDERS];
  if (!employeeId) return all;
  return all.filter((order) => order.employeeId === employeeId);
};

export const getFollowUps = (employeeId = null) =>
  employeeId
    ? MOCK_FOLLOW_UPS.filter((item) => item.employeeId === employeeId)
    : MOCK_FOLLOW_UPS;

export const getOffers = () => MOCK_OFFERS;

export const getStockMovements = () => MOCK_STOCK_MOVEMENTS;

export const getTransfers = () => MOCK_TRANSFERS;

export const getWarehouseTasks = (kind = null) =>
  kind ? MOCK_WAREHOUSE_TASKS.filter((task) => task.kind === kind) : MOCK_WAREHOUSE_TASKS;

export const getSupportCases = () => MOCK_SUPPORT_CASES;

export const getFeedback = () => MOCK_FEEDBACK;

export const getStylingRequests = () => MOCK_STYLING_REQUESTS;

export const getAppointments = () => MOCK_APPOINTMENTS;

export const getPerformance = (employeeId) =>
  MOCK_PERFORMANCE[employeeId] ?? {
    monthlyTarget: 0,
    achievement: 0,
    customersServed: 0,
    ordersAssisted: 0,
    conversion: 0,
    averageTicket: 0,
    followUps: 0,
  };

export const getCatalogueStock = () => {
  const low = products.filter((product) => product.availability === "low-stock");
  const out = products.filter(
    (product) => product.availability === "unavailable" || product.stock === 0
  );
  const available = products.filter(
    (product) => product.availability === "in-stock" || product.availability === "made-to-order"
  );
  return {
    total: products.length,
    available: available.length,
    low: low.length,
    out: out.length,
    lowItems: low.slice(0, 12),
    outItems: out.slice(0, 12),
    availableItems: available.slice(0, 16),
  };
};

export const searchProducts = (term = "") => {
  const query = String(term).trim().toLowerCase();
  if (!query) return products.slice(0, 16);
  return products
    .filter((product) => product.searchText.includes(query) || product.sku.toLowerCase().includes(query))
    .slice(0, 24);
};

export const loadAttendanceMap = () => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.ATTENDANCE, null);
  return stored && typeof stored === "object" ? stored : {};
};

export const attendanceFor = (employeeId, map = loadAttendanceMap()) => {
  const record = map[employeeId];
  if (record && record.date === todayKey()) return record;
  return {
    employeeId,
    date: todayKey(),
    status: "NOT_CHECKED_IN",
    checkedInAt: null,
    checkedOutAt: null,
  };
};

export const defaultDashboardMetrics = (role) => {
  const stock = getCatalogueStock();
  const cases = getSupportCases();
  const styling = getStylingRequests();
  const appointments = getAppointments();
  const transfers = getTransfers();

  if (role === "SALES_EXECUTIVE") {
    return {
      primary: [
        { label: "Today's sales", value: "₹1,24,850", hint: "Floor billed · demo" },
        { label: "Orders assisted", value: "18", hint: "This month" },
        { label: "Customers served", value: "42", hint: "This month" },
        { label: "Pending follow-ups", value: "6", hint: "Open" },
      ],
    };
  }
  if (role === "INVENTORY_MANAGER" || role === "INVENTORY_STAFF") {
    return {
      primary: [
        { label: "Available stock", value: String(stock.available), hint: "SKUs on hand" },
        { label: "Low stock", value: String(stock.low || 7), hint: "Needs reorder" },
        { label: "Out of stock", value: String(stock.out || 3), hint: "Unavailable" },
        { label: "Pending transfers", value: String(transfers.filter((item) => item.status !== "Completed").length), hint: "Open" },
      ],
    };
  }
  if (role === "WAREHOUSE_STAFF") {
    return {
      primary: [
        { label: "Incoming", value: "2", hint: "Consignments today" },
        { label: "Outgoing", value: "2", hint: "Dispatch queue" },
        { label: "Pick & pack", value: "2", hint: "Open picks" },
        { label: "Damaged", value: "2", hint: "Quarantine" },
      ],
    };
  }
  if (role === "CUSTOMER_SUPPORT") {
    return {
      primary: [
        { label: "Open cases", value: String(cases.filter((item) => item.status !== "Resolved").length), hint: "Care desk" },
        { label: "Pending returns", value: "4", hint: "Awaiting review" },
        { label: "Customers assisted", value: "27", hint: "This month" },
        { label: "Response queue", value: "5", hint: "Unanswered" },
      ],
    };
  }
  if (role === "FASHION_STYLIST") {
    return {
      primary: [
        { label: "Appointments", value: String(appointments.length), hint: "This week" },
        { label: "Styling requests", value: String(styling.length), hint: "Open book" },
        { label: "Bridal consultations", value: "3", hint: "Active" },
        { label: "Recommendations", value: "16", hint: "This month" },
      ],
    };
  }
  if (role === "STORE_MANAGER" || role === "SUPER_ADMIN") {
    return {
      primary: [
        { label: "Store sales", value: "₹8,42,600", hint: "Today · demo" },
        { label: "Team on floor", value: "14", hint: "Checked in" },
        { label: "Conversion", value: "28%", hint: "This week" },
        { label: "Low stock alerts", value: String(stock.low || 7), hint: "Needs attention" },
      ],
    };
  }
  return { primary: [] };
};

export default {
  getRegisteredCustomers,
  getDirectoryCustomers,
  getBusinessOrders,
  getAssistedOrders,
  getFollowUps,
  getOffers,
  getStockMovements,
  getTransfers,
  getWarehouseTasks,
  getSupportCases,
  getFeedback,
  getStylingRequests,
  getAppointments,
  getPerformance,
  getCatalogueStock,
  searchProducts,
  loadAttendanceMap,
  attendanceFor,
  defaultDashboardMetrics,
};
