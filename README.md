# ArchAI Code Sight

A powerful architecture analysis and visualization tool that helps developers understand and visualize codebase architecture through interactive graphs and insights.

## Features

- **Codebase Analysis**: Upload and analyze your codebase to understand its structure
- **Architecture Visualization**: Interactive graphs showing service relationships and dependencies
- **GitHub Integration**: Connect directly to GitHub repositories for seamless analysis
- **Service Details**: Deep dive into individual services with detailed information
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Visualization**: Custom React Flow implementation
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/harshaldhaduk/Archai.git
cd Archai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── ArchitectureGraph.tsx
│   ├── CustomNode.tsx
│   └── ServiceDetails.tsx
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Application pages
└── main.tsx           # Application entry point
```

## Usage

1. **Authentication**: Sign up or log in to access the application
2. **Upload Codebase**: Upload your code files or connect to a GitHub repository
3. **Analysis**: The system will analyze your codebase and generate architecture insights
4. **Visualization**: Explore the interactive architecture graph
5. **Details**: Click on services to view detailed information

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

Built with ❤️ for developers who want to understand their codebase architecture.