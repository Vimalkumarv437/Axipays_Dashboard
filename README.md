# Axipays Dashboard & Checkout Interface

## Project Overview

The Axipays Dashboard is a frontend application built with React and Vite. It serves two primary functions:
1. **Checkout Module**: A form for users to securely enter payment information and initiate a transaction.
2. **Dashboard Module**: An analytics view that fetches, processes, and displays transaction data through summary cards, charts, and a paginated table.

This repository contains **only the frontend implementation**. The backend APIs for initiating payments and fetching transactions are already available externally. The frontend consumes these APIs via environment variables. There is no backend server setup required to run this repository.

---

## Backend API Availability

The frontend integrates with already available backend APIs. There is no backend setup required for this frontend project.

The application relies on the following external APIs:
- **Payment Initiation API**: Accepts a JSON payload containing normalized user and card data, along with an HMAC SHA256 signature in the headers for integrity. Returns a success message and a redirection URL.
- **Transaction API**: Returns paginated transaction records used to populate the dashboard table and calculate analytics.

These endpoints are injected into the application via environment variables.

---

## Feature Documentation

### Checkout Module
- **Virtual Credit Card Rendering**: Dynamically updates a visual representation of the credit card as the user types, including masking of the card number.
- **Client-Side Validation**: Enforces Luhn algorithm checks on the card number, strict 3-digit CVV length, email domain validation, and country-specific phone number length (e.g., 10 digits for US/IN, 10 or 11 digits for UK).
- **Payment Initiation**: Maps form data to a specific JSON schema, generates an HMAC signature, and posts to the external payment API.
- **Verification Flow**: If the API responds with a success status and a redirect URL, it opens a modal containing an iframe of the redirect URL, simulating a Secure verification flow, and automatically transitions to a success screen after a brief delay.
- **State Clearing**: Resets all form fields and local component state automatically upon closing the success modal to prevent data leakage.

### Dashboard Module
- **Data Fetching**: Calls the external transaction API with pagination parameters (`page`, `limit`).
- **Data Normalization**: Calculates total transaction volumes, success counts, and categorizes volume by currency.
- **Data Visualization**: Renders a Donut chart for currency breakdown and an Area chart for transaction trends over a 30-day period using Recharts.
- **Interactive Table**: Displays transaction records with functional pagination controls, page-size selection, live text search across IDs and emails, and status filtering. Includes skeleton loading states during network requests.

---

## Code Flow Documentation

### Checkout Flow
1. **User Input**: User fills out the checkout form. React state (`formData`) updates in real-time. Input handlers strip non-numeric characters for phone and CVV.
2. **Validation**: Upon submission, the application performs client-side checks (Luhn validation, string length, regex matching).
3. **Hash Generation**: An HMAC SHA256 signature is generated using the card number, email, and the environment secret key.
4. **API Request**: The form data is normalized to match the expected backend JSON schema and POSTed to the payment API along with the hash header.
5. **Modal Render**: Based on the response, a modal opens. If successful, it loads the `redirect_url` in an iframe.
6. **Success State**: After 3 seconds, the modal automatically transitions to a success screen with a confetti animation. Closing the modal clears the form.

### Dashboard Flow
1. **Initialization**: On component mount or when pagination/filters change, `loadData` is triggered.
2. **API Request**: Fetches the transaction list from the external transaction API.
3. **Normalize**: Iterates over the raw response array to aggregate totals (e.g., sum of `amount` where status is `success`) and build data arrays for the charts.
4. **State Update**: Updates React state variables (`summary`, `currencyData`, `transactions`).
5. **Render**: Passes the normalized state down to Recharts components and the HTML table.

---

## Project Structure & File Responsibilities

### `src/api/paymentApi.js`
- **Purpose**: Handles all HTTP communication with the external backend APIs.
- **Responsibilities**: Initiates payments, fetches paginated dashboard data, and centralizes error throwing.
- **Imports/Dependencies**: `axios`.
- **Used By**: `CheckoutPage.jsx`, `DashboardPage.jsx`.
- **Important Logic**: Constructs axios instances, reads endpoints from `import.meta.env`, and appends the `Hash` header to payment POST requests.

### `src/components/layout/MainLayout.jsx`
- **Purpose**: The core structural shell wrapping the application.
- **Responsibilities**: Provides the flexbox layout container, renders the Navbar, and provides an `<Outlet />` for child routes.
- **Imports/Dependencies**: `react-router-dom` (`Outlet`), `Navbar.jsx`.
- **Used By**: `App.jsx`.
- **Important Logic**: Standard structural component, manages minimum viewport height.

### `src/components/layout/Navbar.jsx`
- **Purpose**: Top navigation with responsive mobile menu.
- **Responsibilities**: Provides navigation links between the Checkout and Dashboard modules.
- **Imports/Dependencies**: `react-router-dom` (`NavLink`, `useLocation`), `lucide-react`.
- **Used By**: `MainLayout.jsx`.
- **Important Logic**: Checks `useLocation().pathname` to apply active styling to the navigation pills.

### `src/components/modal/PaymentModal.jsx`
- **Purpose**: Displays the iframe and success/failure screens for the payment verification flow.
- **Responsibilities**: Manages window dimensions for the confetti effect, renders the redirect URL in a sandboxed iframe, and provides callbacks to close the modal or simulate statuses.
- **Imports/Dependencies**: `react`, `react-confetti`, `lucide-react`.
- **Used By**: `CheckoutPage.jsx`.
- **Important Logic**: Conditionally renders UI blocks (iframe vs. success screen) based on the `status` prop (`'Pending'`, `'Success'`, `'Failed'`).

### `src/pages/CheckoutPage.jsx`
- **Purpose**: The secure payment form and virtual credit card display.
- **Responsibilities**: Captures user input, handles localized validation, constructs the API payload, and manages the lifecycle of the payment modal.
- **Imports/Dependencies**: `react`, `react-toastify`, `paymentApi.js`, `luhnValidator.js`, `hashGenerator.js`, `PaymentModal.jsx`, `lucide-react`.
- **Used By**: `App.jsx` (Route).
- **Important Logic**: Uses `setTimeout` to automatically transition from the pending iframe state to the success state based on the API response message. Handles dynamic `maxLength` for phone numbers based on country selection.

### `src/pages/DashboardPage.jsx`
- **Purpose**: Analytics dashboard and transaction data table.
- **Responsibilities**: Fetches, parses, and visually represents transaction data.
- **Imports/Dependencies**: `react`, `paymentApi.js`, `recharts`, `lucide-react`.
- **Used By**: `App.jsx` (Route).
- **Important Logic**: Iterates over API responses to aggregate `currencyData` for the PieChart and computes dynamic percentage rates for success volume. Handles client-side filtering (Search, Status).

### `src/utils/hashGenerator.js`
- **Purpose**: Cryptographic logic for generating HMAC-SHA256 signatures.
- **Responsibilities**: Combines card number and email, hashes them using the secret key, and outputs a hex string.
- **Imports/Dependencies**: `crypto-js` (via Web Crypto API).
- **Used By**: `CheckoutPage.jsx`.
- **Important Logic**: Uses `crypto.subtle` API to securely generate the signature.

### `src/utils/luhnValidator.js`
- **Purpose**: Client-side mathematical card validation.
- **Responsibilities**: Validates that a card number conforms to the Luhn algorithm.
- **Imports/Dependencies**: None.
- **Used By**: `CheckoutPage.jsx`.
- **Important Logic**: Standard modulo 10 checksum algorithm implementation.

### `src/utils/cardMasking.js`
- **Purpose**: String manipulation for privacy.
- **Responsibilities**: Masks the middle digits of a credit card number and fully masks CVV codes.
- **Imports/Dependencies**: None.
- **Used By**: Component logic (if utilized) or reserved for future utility.
- **Important Logic**: Uses regex and string substitution.

### `src/utils/formatters.js`
- **Purpose**: Standardizes data output formats.
- **Responsibilities**: Formats raw numeric strings into spaced card numbers and standardizes currency output.
- **Imports/Dependencies**: None.
- **Used By**: Component logic (if utilized) or reserved for future utility.
- **Important Logic**: Uses `Intl.NumberFormat` for locale-aware currency strings.

### `src/App.jsx` & `src/main.jsx`
- **Purpose**: React DOM entry point and Router setup.
- **Responsibilities**: Initializes the application, applies global context (`ToastContainer`), and defines the route hierarchy.
- **Imports/Dependencies**: `react-router-dom`, `react-dom/client`.
- **Important Logic**: Wraps routes in `MainLayout` and provides a fallback redirect for unknown paths.

### `src/index.css`
- **Purpose**: Global styles and Tailwind directives.
- **Important Logic**: Contains custom `@keyframes` for the `animate-shine` glass-morphism effect on the virtual credit card.

---

## Security

### Current Implementation
- **HMAC SHA256**: The frontend generates an HMAC signature to prove payload integrity to the backend.
- **Luhn Validation**: Prevents network calls for structurally invalid card numbers.
- **Form Validation**: Strict enforcement of data types and lengths (e.g., CVV, Phone) mitigates malformed data errors.
- **No Local Storage**: Card data exists strictly in React component memory. It is cleared entirely when the modal closes or the component unmounts. No data is stored in `localStorage` or `sessionStorage`.
- **Modal Redirect Handling**: External verification flows are sandboxed inside an iframe to maintain context without exposing the parent window directly.

### ⚠️ Security Notice: Backend Architecture
While this repository demonstrates security concepts (like HMAC hashing) on the frontend for instructional purposes, **adding a backend intermediary is fundamentally more secure.** 
In a true production environment, sensitive secrets (like `SECRET_KEY`) and cryptographic hashing operations should never reside in client-side code, as they can be exposed to end-users. A frontend should ideally send a tokenized payload to a secure backend service, which then signs the request and communicates with the payment gateway.

---

## Environment Variables

The application expects the following variables in a `.env` file at the root directory:

- `AXIPAY_PAYMENT_API`: The full URL string for the backend payment initiation endpoint. Consumed by `paymentApi.js` to execute POST requests.
- `AXIPAY_TABLEDATA_API`: The full URL string for the backend transaction fetching endpoint. Consumed by `paymentApi.js` to execute GET requests.
- `SECRET_KEY`: The secret string used by `hashGenerator.js` to sign the checkout payload.

---

## Setup Instructions

1. **Install Dependencies**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory and define the required variables:
   ```env
   AXIPAY_PAYMENT_API
   AXIPAY_TABLEDATA_API
   SECRET_KEY
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.
