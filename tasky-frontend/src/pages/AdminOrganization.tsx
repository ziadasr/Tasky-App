import React from "react";
import { AdminOrganizationView } from "../components/AdminOrganizationView";
import { NavigateFunction } from "../app";

interface AdminOrganizationPageProps {
  onNavigate: NavigateFunction;
}

export const AdminOrganizationPage: React.FC<AdminOrganizationPageProps> = ({
  onNavigate: _onNavigate,
}) => {
  return <AdminOrganizationView />;
};
