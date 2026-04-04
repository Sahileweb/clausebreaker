# ClauseBreaker AI

**Legal Document Simplifier with Risk Analysis**

ClauseBreaker AI is an intelligent web application that instantly converts complex legal jargon into plain English, highlights potential risks, and provides actionable advice. Powered by Google's Gemini AI, it helps users understand legal documents before they sign.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6.svg)
![Node](https://img.shields.io/badge/Node.js-18+-339933.svg)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Document Analysis
- **Plain English Simplification** - Converts complex legal clauses into easy-to-understand language
- **Risk Assessment** - Automatically identifies and categorizes clauses as Low, Medium, or High risk
- **ELI15 Explanations** - Get "Explain Like I'm 15" breakdowns for each clause
- **Actionable Advice** - Receive specific suggestions for dealing with problematic clauses

### Document Comparison
- **Side-by-Side Comparison** - Compare two versions of a legal document
- **Change Detection** - Identify what changed between original and revised documents
- **Impact Analysis** - Understand how each change affects you
- **Expert Recommendations** - Get AI-powered advice on which version is better

### Multi-Format Support
- **PDF Documents** - Upload and analyze PDF files
- **Word Documents** - Support for .docx files
- **Image Uploads** - Extract text from images of legal documents
- **Text Paste** - Directly paste legal text for analysis

### Additional Features
- **Multi-Language Support** - Analyze documents in multiple languages
- **Chat with Document** - Ask questions about your document and get AI-powered answers
- **Share Reports** - Generate shareable links for analysis reports
- **Download Reports** - Export analysis as PDF or text files
- **API Key Rotation** - Support for multiple Gemini API keys for high availability

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI Framework |
| TypeScript | 5.8.2 | Type Safety |
| Vite | 6.2.0 | Build Tool & Dev Server |
| Tailwind CSS | 4.1.14 | Styling |
| React Router | 7.13.2 | Navigation |
| Framer Motion | 12.23.24 | Animations |
| Lucide React | 0.546.0 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.21.2 | Web Server |
| Node.js | 18+ | Runtime |
| Multer | 2.1.1 | File Uploads |
| PDFKit | 0.16.0 | PDF Generation |
| Mammoth | 1.7.2 | Word Document Parsing |
| PDF-parse | 1.1.5 | PDF Text Extraction |

### AI & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| Google Generative AI | 1.29.0 | AI Model Integration |
| MongoDB | 8.9.5 | Database (for shared reports) |
| Mongoose | 8.9.5 | ODM for MongoDB |

---

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (optional, for sharing reports) - [Download](https://www.mongodb.com/try/download/community)
- **Google Gemini API Key** - [Get one here](https://aistudio.google.com/apikey)

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/clausebreaker.git
   cd clausebreaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   Open `.env` and add your API keys:
   ```env
   # Required: Google Gemini API Key
   GEMINI_API_KEY=your_api_key_here
   
   # Optional: Multiple API keys for rotation (comma-separated)
   GEMINI_API_KEYS=key1,key2,key3
   
   # Optional: MongoDB URI for sharing reports
   MONGODB_URI=mongodb://localhost:27017/clausebreaker
   ```

5. **Start MongoDB** (if using share feature)
   ```bash
   # On Windows
   mongod
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

---

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Other Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run TypeScript type checking |
| `npm run clean` | Remove the dist folder |

---

## Project Structure

```
clausebreaker/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ChatSection.tsx     # Document chat interface
│   │   ├── ClauseCard.tsx      # Individual clause display
│   │   ├── LanguageSelector.tsx # Language dropdown
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── RiskBadge.tsx       # Risk level indicator
│   ├── models/             # MongoDB schemas
│   │   └── Report.ts           # Report schema for sharing
│   ├── pages/              # Page components
│   │   ├── Home.tsx            # Landing page with input
│   │   ├── Analysis.tsx        # Analysis results page
│   │   └── Comparison.tsx      # Document comparison page
│   ├── services/           # API integrations
│   │   └── geminiService.ts    # Google Gemini AI service
│   ├── lib/                # Utilities
│   │   └── utils.ts            # Helper functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite type declarations
├── server.ts               # Express backend server
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite configuration
└── .env.example            # Environment template
```

### Key Directories

- **`src/components/`** - Reusable UI components (buttons, cards, badges)
- **`src/pages/`** - Full page components for each route
- **`src/services/`** - External API integrations (Gemini AI)
- **`src/models/`** - Database schemas for MongoDB

---

## API Endpoints

The application exposes the following REST API endpoints:

### Document Parsing

**POST** `/api/parse-document`
- **Purpose**: Extract text from uploaded files (PDF, DOCX, Images)
- **Content-Type**: `multipart/form-data`
- **Request Body**: 
  - `file`: File upload (PDF, DOCX, or image)
- **Response**:
  ```json
  {
    "text": "Extracted document text..."
  }
  ```

### Document Analysis

**POST** `/api/analyze`
- **Purpose**: Analyze legal text using Gemini AI
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Legal document text...",
    "language": "English"
  }
  ```
- **Response**:
  ```json
  {
    "summary": "Document summary...",
    "overallRisk": "medium",
    "clauses": [
      {
        "text": "Original clause text...",
        "simplified": "Plain English version...",
        "risk": "high",
        "explanation": "ELI15 explanation...",
        "suggestion": "Recommended action..."
      }
    ]
  }
  ```

### Share Report

**POST** `/api/share`
- **Purpose**: Create a shareable report link
- **Content-Type**: `application/json`
- **Request Body**: Analysis result object
- **Response**:
  ```json
  {
    "link": "http://localhost:3000/api/share/abc123/download?pw=xyz789"
  }
  ```

### Download Shared Report

**GET** `/api/share/:id/download`
- **Purpose**: Download a shared analysis as PDF
- **Query Parameters**: `pw` (password)
- **Response**: PDF file download

### Health Check

**GET** `/api/health`
- **Purpose**: Check server status
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key | `AIzaSy...` |
| `GEMINI_API_KEYS` | No | Comma-separated list of API keys for rotation | `key1,key2,key3` |
| `MONGODB_URI` | No | MongoDB connection string (for sharing) | `mongodb://localhost:27017/clausebreaker` |
| `NODE_ENV` | No | Environment mode | `development` or `production` |

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

---

## Usage Guide

### Analyzing a Document

1. **Navigate to the homepage** (`http://localhost:3000`)
2. **Upload a document** or **paste legal text** into the input area
3. **Select your language** from the dropdown (optional)
4. **Click "Analyze Now"**
5. **Review the results**:
   - Executive summary
   - Overall risk level
   - Individual clause breakdowns with risk badges
   - Actionable advice for each clause

### Comparing Documents

1. **Click the "Compare" button** in the navigation
2. **Upload or paste Document 1** (original)
3. **Upload or paste Document 2** (revised)
4. **Click "Compare Documents"**
5. **Review the differences**:
   - Side-by-side comparison
   - Impact analysis for each change
   - Expert recommendation

### Chatting with Your Document

After analyzing a document, use the chat feature to:
- Ask specific questions about clauses
- Get clarifications on legal terms
- Understand implications of specific sections

### Sharing Reports

1. On the Analysis page, click **"Share Analysis"**
2. A unique link will be generated and copied to your clipboard
3. Share the link with others (includes password protection)

### Downloading Reports

- **Text Format**: Click "Download Report" to save as `.txt`
- **PDF Format**: Use the shared link to download a formatted PDF

---

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

For issues, questions, or feature requests, please open an issue on the [GitHub repository](https://github.com/your-username/clausebreaker/issues).

---

**Built with ❤️ by the ClauseBreaker Team**
