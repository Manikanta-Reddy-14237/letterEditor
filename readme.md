# Letter Editor Application

This application allows users to create, edit, and save letters directly to their Google Drive. It provides a seamless experience for managing documents, integrating with Firebase authentication and Google Drive API.

## Table of Contents

-   [Project Description](#project-description)
-   [Features](#features)
-   [Technologies Used](#technologies-used)
-   [Prerequisites](#prerequisites)
-   [Setup and Installation](#setup-and-installation)
-   [Environment Variables](#environment-variables)
-   [Running the Application](#running-the-application)
-   [Deployment](#deployment)
-   [Contributing](#contributing)
-   [License](#license)

## Project Description

The Letter Editor application consists of a frontend (React) and a backend (Node.js/Express) that work together to provide users with a convenient way to manage their documents. Users can authenticate using Firebase, edit letters in a rich text editor, and save their documents directly to Google Drive.

## Features

-   **Firebase Authentication:** Secure user authentication using Google Sign-In.
-   **Rich Text Editor:** Intuitive interface for creating and editing letters.
-   **Google Drive Integration:** Seamlessly save documents to the user's Google Drive.
-   **File Management:** List and view files stored in Google Drive.
-   **Token Validation:** Secure token validation for API requests.

## Technologies Used

-   **Frontend:**
    -   React
    -   Material UI
    -   Vite
    -   Firebase
-   **Backend:**
    -   Node.js
    -   Express.js
    -   MongoDB
    -   Google Drive API
    -   Pandoc
    -   Firebase Admin SDK

## Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js and npm
-   MongoDB
-   Firebase project
-   Google Cloud Platform project with Google Drive API enabled
-   Pandoc (for DOCX conversion)

## Setup and Installation

1.  **Clone the Repository:**

    ```bash
    git clone <your-repository-url>
    cd Assignment
    ```

2.  **Install Backend Dependencies:**

    ```bash
    cd api
    npm install
    ```

3.  **Install Frontend Dependencies:**

    ```bash
    cd ../app
    npm install
    ```

4.  **Configure Environment Variables:**

    -   Create `.env` files in both the `api` and `app` directories.
    -   Populate the `.env` files with the required environment variables (see the [Environment Variables](#environment-variables) section).

## Environment Variables

-   **`api/.env`:**
    ```
    MONGODB_URI=your_mongodb_uri
    JWT_SECRET=your_jwt_secret
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    FIREBASE_PROJECT_ID=your_firebase_project_id
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    FIREBASE_CLIENT_EMAIL=your_firebase_client_email
    ```

-   **`app/.env`:**
    ```
    VITE_API_KEY=your_firebase_api_key
    VITE_AUTH_DOMAIN=your_firebase_auth_domain
    VITE_PROJECT_ID=your_firebase_project_id
    VITE_STORAGE_BUCKET=your_firebase_storage_bucket
    VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    VITE_APP_ID=your_firebase_app_id
    ```

    **Note:** Never commit your `.env` files to version control.

## Running the Application

1.  **Start the Backend:**

    ```bash
    cd ../api
    npm run dev
    ```

2.  **Start the Frontend:**

    ```bash
    cd ../app
    npm run dev
    ```

3.  Open your browser and navigate to `http://localhost:5173`.

## Deployment

This application can be deployed to Render. Follow these steps:

1.  **Push to GitHub:** Ensure your code is pushed to a GitHub repository.
2.  **Create Render Web Services:**
    -   Create two web services on Render: one for the `api` directory and one for the `app` directory.
3.  **Connect to GitHub:** Connect your Render services to your GitHub repository.
4.  **Configure Environment Variables:** Add the environment variables from your `.env` files to the Render service settings.
5.  **Set Build and Start Commands:**
    -   **`api`:**
        -   Build command: `npm install`
        -   Start command: `node index.js`
    -   **`app`:**
        -   Build command: `npm install && npm run build`
        -   Publish directory: `dist`
6.  **Deploy:** Deploy your services.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Commit your changes.
4.  Push to your fork.
5.  Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).