import React, { ReactNode } from "react";

// --- Spinner ---
export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-4">
    <svg
      className="animate-spin h-5 w-5 text-indigo-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span className="ml-2 text-sm text-gray-500">Loading...</span>
  </div>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | null;
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  type = "text",
  error,
  ...props
}) => (
  <div className="mb-4">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <input
      type={type}
      id={id}
      className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out ${
        error ? "border-red-500" : "border-gray-300"
      }`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// --- Select ---
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string | null;
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  options,
  error,
  ...props
}) => (
  <div className="mb-4">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <select
      id={id}
      className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white transition duration-150 ease-in-out ${
        error ? "border-red-500" : "border-gray-300"
      }`}
      {...props}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// --- Button ---
type ButtonVariant = "primary" | "secondary" | "danger" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyle =
    "px-4 py-2 rounded-lg font-semibold shadow-md transition duration-200 ease-in-out transform";
  let variantStyle = "";

  switch (variant) {
    case "primary":
      variantStyle =
        "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 active:scale-95";
      break;
    case "secondary":
      variantStyle =
        "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 active:scale-95";
      break;
    case "danger":
      variantStyle =
        "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 active:scale-95";
      break;
    case "outline":
      variantStyle =
        "border border-indigo-500 text-indigo-600 hover:bg-indigo-50 disabled:text-gray-400 active:scale-95";
      break;
    default:
      variantStyle =
        "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300";
  }

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Card ---
interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-xl transition-shadow hover:shadow-2xl ${className}`}
  >
    {children}
  </div>
);
