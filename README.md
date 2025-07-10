# 🫡 This repository uses the ULTIMATE IC VIBE CODING TEMPLATE from the github repository link https://github.com/pt-icp-hub/IC-Vibe-Coding-Template-Motoko

July 7, 2025
As of the time we are writing, currently we are still designing the architecture and refining the idea. We will work on the repository by the start of the following week. 

# 🏪 SRV A Local Service Marketplace

A decentralized service marketplace built on the Internet Computer Protocol (ICP) that connects users with local service providers through secure, transparent, and AI-enhanced booking experiences.

## 🌟 What We're Building

Our platform revolutionizes local service booking by leveraging ICP's unique capabilities to create a trustworthy marketplace where users can discover, book, and rate local service providers with confidence.

### 🎯 Unique Value Proposition

**🤖 AI-Powered Reputation System**

- Intelligent monitoring of user activities including booking patterns and review behaviors
- Advanced review sentiment analysis for authentic feedback verification
- Machine learning algorithms that detect fraudulent reviews and suspicious activity patterns

**📋 Smart Work Verification**

- AI-powered validation of completed work through document and media analysis
- Automated quality assessment of service provider deliverables
- Proof-of-work verification system ensuring service completion standards

**🔒 Decentralized Trust & Security**

- Leverages ICP's tamper-proof infrastructure for transparent reputation scoring
- Immutable booking history and review records
- Secure identity management without compromising user privacy

### 🚀 Current Features

- **Service Discovery**: Browse and search local service providers by category and location
- **Booking System**: Seamless appointment scheduling with calendar integration
- **Ratings & Reviews**: Community-driven feedback system with AI verification
- **COD Payments**: Secure cash-on-delivery payment options

---

## 🚀 Getting Started

### 🧑‍💻 1. Development Environment Setup

This project uses a **devcontainer** for consistent development environments:

- Clone this repository
- Open in VS Code and reopen in container when prompted
- Or use GitHub Codespaces with 4-core 16GB RAM configuration

### 2. Install Dependencies

```bash
npm install
mops install
```

### 3. Running Ollama (For AI Features)

To enable AI-powered features locally, you'll need Ollama for LLM processing:

```bash
ollama serve
# Expected to start listening on port 11434
```

In a separate terminal, download the required model:

```bash
ollama run llama3.1:8b
```

Once loaded, you can terminate with `/bye`. This step only needs to be done once.

### 4. Deployment

Start the local Internet Computer replica:

```bash
dfx start --clean
```

Deploy the canisters:

```bash
dfx deploy # deploys the backend and frontend canisters
```

Deploy LLM dependencies:

```bash
dfx deps pull
dfx deps deploy  # deploys the llm canister
```

### 5. Start Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:5173`

### 6. Run Tests

```bash
npm test
```

For specific test files:

```bash
npm test tests/src/backend.test.ts    # individual test
```

---

## 📁 Project Structure

```
Local-Service-Marketplace/
├── .devcontainer/devcontainer.json       # Container config for development
├── .github/instructions/                 # Copilot context and guidance
├── .github/prompts/                      # Copilot workflow prompts
├── .github/workflows/                    # GitHub CI/CD pipelines
├── src/
│   ├── backend/                          # Motoko backend canister
│   │   └── main.mo                       # Main business logic
│   ├── frontend/                         # React + Tailwind + TypeScript UI
│   │   ├── src/
│   │   │   ├── App.tsx                   # Main application component
│   │   │   ├── components/               # Reusable UI components
│   │   │   ├── services/                 # Canister service integrations
│   │   │   └── views/                    # Page-level components
│   │   ├── tests/                        # Frontend unit tests
│   │   └── vite.config.ts                # Build configuration
│   └── declarations/                     # Auto-generated canister interfaces
├── tests/
│   ├── src/                              # Backend integration tests
│   └── vitest.config.ts                  # Test configuration
├── dfx.json                              # ICP canister configuration
└── mops.toml                             # Motoko package configuration
```

---

## ✅ Testing Patterns

The project uses a comprehensive testing approach:

- **Backend Tests**: PocketIC for canister integration testing
- **Frontend Tests**: Vitest for React component and service testing
- **End-to-End**: Automated workflows testing critical user paths

Run tests during development:

```bash
npm test                                   # All tests
npm test tests/src/backend.test.ts        # Backend only
npm test src/frontend/tests/              # Frontend only
```

---

## 🔄 CI/CD Workflow

Automated workflows in `.github/workflows/` include:

- **🧪 Test Automation**: Full test suite execution on pull requests
- **📦 Build Verification**: Ensures deployable builds
- **🔍 Code Quality**: Linting and formatting checks

Future enhancements:

- Security audits and dependency scanning
- Test coverage reporting
- Performance benchmarking

---

## 🧠 GitHub Copilot Integration

This project includes AI-assisted development through customized instructions and prompts:

### 📝 Instructions (`.github/instructions/`)

Provide context for AI assistance:

- **general.instructions.md**: Project-wide context and conventions
- **motoko.instructions.md**: Motoko-specific coding standards
- **test.instructions.md**: Testing patterns and practices

### 🛠️ Prompts (`.github/prompts/`)

Structured workflows for common tasks:

#### Add Feature Prompt

```markdown
/add-feature Add service provider verification system
```

Follows a structured approach:

1. **Specification**: Updates changelog and clarifies requirements
2. **Test-First**: Creates failing tests for new functionality
3. **Implementation**: Builds feature with proper error handling
4. **Validation**: Runs tests and performs code quality checks

#### Changes Review Prompt

```markdown
/changes-review
```

Analyzes git diffs and provides comprehensive code review covering:

- **Business Logic**: Edge cases and side effects
- **Code Quality**: Refactoring opportunities
- **Security & Performance**: Vulnerabilities and optimizations

---

## 📚 Learning Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [Motoko Programming Language](https://internetcomputer.org/docs/motoko/home)
- [PocketIC Testing Framework](https://dfinity.github.io/pic-js/)
- [Vitest Testing Guide](https://vitest.dev/)
- [GitHub Copilot Customization](https://code.visualstudio.com/docs/copilot/copilot-customization)

---

## 🤝 Contributing

We welcome contributions to improve the marketplace! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

For bugs or feature requests, please open an issue with detailed information.

---

**Build the future of local services with decentralized trust 🚀**
