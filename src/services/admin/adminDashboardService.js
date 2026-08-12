/**
 * PRATIKSHYA FASHON — Admin dashboard reads.
 *
 * Presentation-ready business figures assembled from centralised mock data
 * and from the systems that already exist:
 *
 *   employees → EmployeeManagementContext (Phase 10 state, passed in)
 *   orders    → OrderContext / orderService (Phase 9 state, passed in)
 *   business  → src/data/admin/dashboardData.js (mock, static)
 *
 * Nothing here randomises on render, and nothing here writes. Employee and
 * order data are passed in by the caller so the Admin Portal never opens a
 * second, disconnected source of truth.
 */

import {
  BUSINESS_METRICS,
  DEMO_RECENT_ORDERS,
  DEPARTMENT_PERFORMANCE,
  INVENTORY_ALERTS,
  METRIC_TRENDS,
  SALES_BY_CATEGORY,
  SALES_SERIES,
  TOP_DEPARTMENTS,
} from "../../data/admin/dashboardData";
import { EMPLOYEE_STATUS } from "../../config/employeeStatus";
import { getDepartmentLabel } from "../../config/employeeDepartments";
import { getRoleLabel } from "../../config/employeeRoles";
import { employeeFullName } from "../../utils/employee";

/* ------------------------------------------------------------------ */
/* Headline metrics                                                    */
/* ------------------------------------------------------------------ */

/**
 * The nine dashboard tiles. `employeesPresent` prefers the live employee
 * register when one is supplied, so a newly created colleague is reflected
 * immediately.
 */
export const getBusinessMetrics = (employees = []) => {
  const activeEmployees = employees.filter(
    (person) => person.status === EMPLOYEE_STATUS.ACTIVE
  ).length;

  return {
    ...BUSINESS_METRICS,
    employeesPresent: activeEmployees || BUSINESS_METRICS.employeesPresent,
  };
};

export const getMetricTrends = () => METRIC_TRENDS;

/* ------------------------------------------------------------------ */
/* Sales overview                                                      */
/* ------------------------------------------------------------------ */

export const getSalesSeries = () => SALES_SERIES;

export const getSalesByCategory = () => SALES_BY_CATEGORY;

export const getSalesSummary = () => {
  const total = SALES_SERIES.reduce((sum, point) => sum + point.sales, 0);
  const orders = SALES_SERIES.reduce((sum, point) => sum + point.orders, 0);
  const peak = SALES_SERIES.reduce(
    (best, point) => (point.sales > best.sales ? point : best),
    SALES_SERIES[0]
  );
  return {
    total,
    orders,
    average: Math.round(total / (SALES_SERIES.length || 1)),
    averageTicket: orders ? Math.round(total / orders) : 0,
    peak,
  };
};

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export const getDepartmentPerformance = () =>
  DEPARTMENT_PERFORMANCE.map((department) => ({
    ...department,
    achievement: department.target
      ? Math.round((department.sales / department.target) * 100)
      : 0,
  }));

export const getTopDepartments = () => TOP_DEPARTMENTS;

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

export const getInventoryAlerts = () => INVENTORY_ALERTS;

export const getInventoryAlertCounts = () => ({
  low: INVENTORY_ALERTS.filter((alert) => alert.level === "LOW").length,
  out: INVENTORY_ALERTS.filter((alert) => alert.level === "OUT").length,
});

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

/**
 * Flattens real customer orders into the admin row shape. When the browser
 * has no orders yet, a clearly-labelled demo set is returned instead so the
 * panel is never empty in a fresh preview.
 */
export const getRecentOrders = (orders = [], limit = 5) => {
  const rows = (Array.isArray(orders) ? orders : [])
    .slice(0, limit)
    .map((order) => ({
      id: order.id,
      customer: order.customer?.fullName || "Guest",
      items: Array.isArray(order.items)
        ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
        : 0,
      amount: Number(order.pricing?.total) || 0,
      status: order.status,
      placedAt: order.createdAt,
      isDemo: false,
    }));

  if (rows.length > 0) return rows;

  return DEMO_RECENT_ORDERS.slice(0, limit).map((order) => ({ ...order, isDemo: true }));
};

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

/** Employee counts read straight off the shared Phase 10 register. */
export const getEmployeeOverview = (employees = []) => {
  const count = (status) => employees.filter((person) => person.status === status).length;
  return {
    total: employees.length,
    active: count(EMPLOYEE_STATUS.ACTIVE),
    onLeave: count(EMPLOYEE_STATUS.ON_LEAVE),
    suspended: count(EMPLOYEE_STATUS.SUSPENDED),
    inactive: count(EMPLOYEE_STATUS.INACTIVE),
    pending: count(EMPLOYEE_STATUS.PENDING),
  };
};

/**
 * Colleagues an administrator should look at today: blocked accounts and
 * anyone still holding a temporary password.
 */
export const getEmployeesNeedingAttention = (employees = [], limit = 5) =>
  employees
    .filter(
      (person) =>
        person.status === EMPLOYEE_STATUS.SUSPENDED ||
        person.status === EMPLOYEE_STATUS.INACTIVE ||
        person.mustChangePassword
    )
    .slice(0, limit)
    .map((person) => ({
      employeeId: person.employeeId,
      name: employeeFullName(person),
      role: getRoleLabel(person.role),
      department: getDepartmentLabel(person.department),
      status: person.status,
      reason:
        person.status === EMPLOYEE_STATUS.SUSPENDED
          ? "Suspended — login blocked"
          : person.status === EMPLOYEE_STATUS.INACTIVE
            ? "Inactive — login blocked"
            : "Temporary password not yet changed",
    }));

export default {
  getBusinessMetrics,
  getMetricTrends,
  getSalesSeries,
  getSalesByCategory,
  getSalesSummary,
  getDepartmentPerformance,
  getTopDepartments,
  getInventoryAlerts,
  getInventoryAlertCounts,
  getRecentOrders,
  getEmployeeOverview,
  getEmployeesNeedingAttention,
};
