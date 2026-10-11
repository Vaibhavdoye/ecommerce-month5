# E-Commerce Web Application — Month 5

## 1. Project Overview

This project is a full-stack e-commerce web application developed as part of the Month 5 project requirements. It provides product browsing, search and filtering, shopping cart management, checkout, and order history. The project also includes Progressive Web App (PWA) functionality, GraphQL APIs, real-time subscriptions, and performance optimization.

## 2. Live Demo

- **Frontend:** https://ecommerce-month5-frontend.onrender.com
- **Backend API:** https://ecommerce-month5.onrender.com
- **GitHub Repository:** https://github.com/Vaibhavdoye/ecommerce-month5

## 3. Key Features

- Responsive user interface for desktop and mobile devices.
- Product listing and product management.
- Product search, category filtering, price filtering, sorting, and pagination.
- User registration and login.
- Shopping cart with quantity updates.
- Checkout and order history.
- Progressive Web App (PWA) installation and offline caching.
- Push notification support.
- GraphQL queries and mutations.
- Real-time product-created subscriptions using WebSockets.
- Serverless health-check functionality.
- Lazy loading and code splitting for improved performance.
- Input validation and structured error handling.
- Automated tests and continuous integration using GitHub Actions.

## 4. Technology Stack

The project uses TypeScript across the frontend and backend.

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **API:** REST and GraphQL
- **Real-time communication:** WebSockets and `graphql-ws`
- **Database:** MongoDB
- **Testing:** Automated frontend and backend tests
- **Deployment:** Render
- **Version Control and CI:** Git, GitHub, GitHub Actions
- **PWA:** Service worker and web app manifest

## 5. Project Structure

```text
ecommerce-month5/
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── graphql/
│   │   └── models/
│   ├── package.json
│   └── package-lock.json
└── README.md
```

*Note: This is a simplified structure. Refer to the repository for the complete file structure.*

## 6. Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB connection
- Git

### Clone the repository

```bash
git clone https://github.com/Vaibhavdoye/ecommerce-month5.git
cd ecommerce-month5
```

### Start the backend

```bash
cd backend
npm install
```

Configure the required environment variables using the backend's existing environment configuration. Do not commit database credentials, API keys, or secrets.

Build and run the backend using the scripts defined in `backend/package.json`:

```bash
npm run build
npm test
```

Use the available start script in `backend/package.json` to run the backend.

### Start the frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL according to the environment configuration used by the project, then run:

```bash
npm run build
npm test
npm run dev
```

*Note: Available scripts may vary. Check each folder's `package.json` for the exact commands.*

## 7. GraphQL API and Real-Time Subscriptions

The backend exposes a GraphQL endpoint at:

`https://ecommerce-month5.onrender.com/graphql`

The GraphQL API supports product queries, product creation, product updates, and product deletion.

A real-time `productCreated` subscription sends an event when a product is created through the GraphQL mutation. The subscription was tested against the deployed backend using a WebSocket client and a GraphQL mutation. The test successfully received the `productCreated` event.

## 8. Performance and Responsiveness

Performance improvements include lazy-loaded pages, lazy-loaded product images, and code splitting. The application was tested using Lighthouse mobile emulation and achieved the following scores during testing:

| Category | Score |
|---|---:|
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

These are recorded test results and may vary across devices and test runs.

## 9. Testing and Validation

The project was checked through automated tests and manual testing.

- Backend automated tests: 7 passed.
- Frontend automated tests: 1 passed.
- TypeScript backend build completed successfully.
- GitHub Actions CI workflow completed successfully.
- User registration and login tested.
- Shopping cart quantity updates tested.
- Checkout and order history tested.
- GraphQL API and real-time subscription tested against the live backend.
- Responsive layout, PWA installation, offline caching, and Lighthouse scores checked.

## 10. Deployment

The frontend and backend are deployed on Render.

- Frontend: https://ecommerce-month5-frontend.onrender.com
- Backend: https://ecommerce-month5.onrender.com

The application uses environment configuration for deployment. Sensitive credentials must be stored in environment variables rather than committed to the repository.

## 11. Future Enhancements

- Expand automated test coverage.
- Improve offline shopping-cart synchronization.
- Add further monitoring and performance analytics.
- Extend real-time functionality to additional events.

## 12. Conclusion

This project demonstrates the development and deployment of a full-stack e-commerce application with TypeScript, PWA support, GraphQL APIs, real-time subscriptions, responsive design, performance optimization, and automated testing.