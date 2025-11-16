import React, { useState, useMemo, useEffect } from "react";
import { Card } from "./common/UIComponents";
import { apiService } from "../api/api";

// API Response interface
interface Employee {
  id: number;
  name: string;
  email: string;
  role: "Manager" | "Employee" | "Admin";
  department: string;
  salary: number;
  directManagerId?: number;
  createdAt: string;
  lastLogin?: string;
  status?: "Active" | "Inactive";
}

interface AdminOrganizationViewProps {}

export const AdminOrganizationView: React.FC<
  AdminOrganizationViewProps
> = () => {
  const [filterRole, setFilterRole] = useState<"all" | "Manager" | "Employee">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "salary" | "createdAt" | "lastLogin" | "department"
  >("name");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const role = filterRole === "all" ? undefined : filterRole;
        const offset = (currentPage - 1) * itemsPerPage;
        const data = await apiService.getAllEmployees(
          offset,
          itemsPerPage,
          role,
          sortBy,
          sortDir
        );
        setEmployees(data.employees || []);
        setTotalCount(data.totalCount || 0);
      } catch (err: any) {
        console.error("Error fetching employees:", err);
        setError(err.message || "Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [
    filterRole,
    sortBy,
    sortDir,
    filterDepartment,
    currentPage,
    itemsPerPage,
  ]);

  // Filter by search query
  const filteredEmployees = useMemo(() => {
    let result = employees;

    // Filter by department
    if (filterDepartment !== "all") {
      result = result.filter(
        (e: Employee) => e.department === filterDepartment
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e: Employee) =>
          e.name.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query)
      );
    }

    return result;
  }, [employees, searchQuery, filterDepartment]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(employees.map((e: Employee) => e.department));
    return Array.from(depts).sort();
  }, [employees]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const managers = employees.filter(
      (e: Employee) => e.role === "Manager"
    ).length;
    const employeeCount = employees.filter(
      (e: Employee) => e.role === "Employee"
    ).length;
    const totalSalary = employees.reduce(
      (sum: number, e: Employee) => sum + (e.salary || 0),
      0
    );
    const avgSalary =
      totalEmployees > 0 ? Math.round(totalSalary / totalEmployees) : 0;

    return { totalEmployees, managers, employeeCount, totalSalary, avgSalary };
  }, [employees]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Total Employees</h3>
          <p className="text-3xl font-extrabold mt-2">{stats.totalEmployees}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Managers</h3>
          <p className="text-3xl font-extrabold mt-2">{stats.managers}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Employees</h3>
          <p className="text-3xl font-extrabold mt-2">{stats.employeeCount}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Total Salary</h3>
          <p className="text-2xl font-extrabold mt-2">
            EGP {(stats.totalSalary / 1000).toFixed(0)}k
          </p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg rounded-lg">
          <h3 className="text-sm font-medium opacity-90">Avg Salary</h3>
          <p className="text-3xl font-extrabold mt-2">
            EGP {(stats.avgSalary / 1000).toFixed(0)}k
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as "all" | "Manager" | "Employee")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="Manager">Managers</option>
              <option value="Employee">Employees</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept: string) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "name"
                    | "salary"
                    | "createdAt"
                    | "lastLogin"
                    | "department"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Name</option>
              <option value="salary">Salary</option>
              <option value="createdAt">Date Created</option>
              <option value="lastLogin">Last Login</option>
              <option value="department">Department</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Direction
            </label>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "ASC" | "DESC")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ASC">Ascending ↑</option>
              <option value="DESC">Descending ↓</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Organization Structure
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Email
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Role
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Department
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Manager ID
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Salary
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Created At
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Last Login
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee: Employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{employee.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.role === "Manager"
                          ? "bg-purple-100 text-purple-800"
                          : employee.role === "Admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {employee.department}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {employee.directManagerId || "—"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    EGP {(employee.salary || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {employee.lastLogin
                      ? new Date(employee.lastLogin).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-8">
                  <p className="text-gray-500 text-lg">
                    No employees found matching your filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              No employees found matching your filters.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Items per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing{" "}
            {employees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
            employees
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
